import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { categoryFieldNameOfCategoryName } from '../reader/utils';
import PdfViewer from './PdfViewer';
import PdfListView from './PdfListView';
import AnnotationStorage from '../util/AnnotationStorage';
import ApiUtil from '../util/ApiUtil';
import * as ReaderActions from './actions';
import _ from 'lodash';

const PARALLEL_DOCUMENT_REQUESTS = 3;

export class DecisionReviewer extends React.Component {
  constructor(props) {
    super(props);

    let selectedLabels = {
      decisions: false,
      layperson: false,
      privateMedical: false,
      procedural: false,
      vaMedial: false,
      veteranSubmitted: false
    };

    this.state = {
      // We want to show the list view (currentPdfIndex null), unless
      // there is just a single pdf in which case we want to just show
      // the first pdf.
      currentPdfIndex: this.props.appealDocuments.length > 1 ? null : 0,
      filterBy: '',
      isCommentLabelSelected: false,
      selectedLabels,
      sortBy: 'date',
      sortDirection: 'ascending',
      unsortedDocuments: this.props.appealDocuments.map((doc) => {
        doc.receivedAt = doc.received_at;

        return doc;
      })
    };

    this.props.onReceiveDocs(this.props.appealDocuments);

    this.annotationStorage = new AnnotationStorage(this.props.annotations);

    this.state.documents = this.filterDocuments(
      this.sortDocuments(this.state.unsortedDocuments));
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.appealDocuments !== nextProps.appealDocuments) {
      this.props.onReceiveDocs(nextProps.appealDocuments);
    }
  }

  onPreviousPdf = () => {
    const currentPdfIndex = Math.max(this.state.currentPdfIndex - 1, 0);

    this.setPage(currentPdfIndex);
  }

  documentUrl = (doc) => {
    return `/document/${doc.id}/pdf`;
  }

  // This method is used for updating attributes of documents.
  // Since we maintain a sorted and unsorted list of documents
  // when we update one, we need to update the other.
  setDocumentAttribute = (pdfNumber, field, value) => {
    let unsortedDocs = [...this.state.unsortedDocuments];
    let documentId = this.state.documents[pdfNumber].id;

    // We need to update the attribute in both the unsorted
    // and sorted list of documents. PdfNumber refers to the
    // sorted list. For the unsorted list, we need to look
    // it up by documentId.
    unsortedDocs.forEach((doc) => {
      if (doc.id === documentId) {
        doc[field] = value;
      }
    });

    let docs = [...this.state.documents];

    docs[pdfNumber][field] = value;

    this.setState({
      documents: docs,
      unsortedDocuments: unsortedDocs
    });
  }

  pdfNumberFromId = (pdfId) => _.findIndex(this.state.documents, { id: pdfId })

  showPdf = (pdfId) => (event) => {
    // If the user is trying to open the link in a new tab/window
    // then follow the link. Otherwise if they just clicked the link
    // keep them contained within the SPA.
    // ctrlKey for windows
    // shift key for opening in new window
    // metaKey for Macs
    // button for middle click
    if (event.ctrlKey ||
        event.shiftKey ||
        event.metaKey ||
        (event.button &&
        event.button === 1)) {

      this.markAsRead(pdfId);

      return true;
    }

    event.preventDefault();
    this.props.selectCurrentPdf(pdfId);
  }

  markAsRead = (pdfId) => {
    // For some reason calling this synchronosly prevents the new
    // tab from opening. Move it to an asynchronus call.
    setTimeout(() =>
      this.props.handleSetLastRead(pdfId)
    );

    this.props.selectCurrentPdf(pdfId);
    ApiUtil.patch(`/document/${pdfId}/mark-as-read`).
      catch(() => {
        /* eslint-disable no-console */
        console.log('Error marking as read');
        /* eslint-enable no-console */
      });
  }

  onShowList = () => {
    this.props.unselectPdf();
  }

  sortAndFilter = () => {
    this.setState({
      documents: this.filterDocuments(
        this.sortDocuments(this.state.unsortedDocuments))
    });
  }

  sortDocuments = (documents) => {
    let documentCopy = [...documents];
    let multiplier;

    if (this.state.sortDirection === 'ascending') {
      multiplier = 1;
    } else if (this.state.sortDirection === 'descending') {
      multiplier = -1;
    } else {
      return;
    }

    documentCopy.sort((doc1, doc2) => {
      if (this.state.sortBy === 'date') {
        return multiplier * (new Date(doc1.receivedAt) - new Date(doc2.receivedAt));
      } else if (this.state.sortBy === 'type') {
        return multiplier * (doc1.type < doc2.type ? -1 : 1);
      }

      return 0;

    });

    return documentCopy;
  }

  componentDidMount = () => {
    let downloadDocuments = (documentUrls, index) => {
      if (index >= documentUrls.length) {
        return;
      }

      ApiUtil.get(documentUrls[index], { cache: true }).
        then(() => {
          downloadDocuments(documentUrls, index + PARALLEL_DOCUMENT_REQUESTS);
        });
    };

    for (let i = 0; i < PARALLEL_DOCUMENT_REQUESTS; i++) {
      downloadDocuments(this.props.appealDocuments.map((doc) => {
        return this.documentUrl(doc);
      }), i);
    }
  }

  changeSortState = (sortBy) => () => {
    let sortDirection = this.state.sortDirection;

    // if you click the same label then we want to
    // flip the sort type. Otherwise if you're clicking
    // a new label, we want this to sort ascending.
    if (this.state.sortBy === sortBy) {
      if (sortDirection === 'ascending') {
        sortDirection = 'descending';
      } else {
        sortDirection = 'ascending';
      }
    } else {
      sortDirection = 'ascending';
    }

    this.setState({
      sortBy,
      sortDirection
    }, this.sortAndFilter);
  }

  metadataContainsString = (doc, searchString) => {
    if (doc.type.toLowerCase().includes(searchString)) {
      return true;
    } else if (doc.receivedAt.toLowerCase().includes(searchString)) {
      return true;
    }
  }

  // This filters documents to those that contain the search text
  // in either the metadata (type, date) or in the comments
  // on the document.
  filterDocuments = (documents) => {
    let filterBy = this.state.filterBy.toLowerCase();
    let labelsSelected = Object.keys(this.state.selectedLabels).
      reduce((anySelected, label) =>
        anySelected || this.state.selectedLabels[label], false);

    let filteredDocuments = documents.filter((doc) => {
      // if there is a label selected, we filter on that.
      if (labelsSelected && !this.state.selectedLabels[doc.label]) {
        return false;
      }

      let annotations = this.annotationStorage.getAnnotationByDocumentId(doc.id);

      if (this.state.isCommentLabelSelected && annotations.length === 0) {
        return false;
      }

      if (this.metadataContainsString(doc, filterBy)) {
        return true;
      }

      if (annotations.some((annotation) => annotation.comment.
        toLowerCase().includes(filterBy))) {
        return true;
      }

      return false;
    });

    return filteredDocuments;
  }

  onFilter = (filterBy) => {
    this.setState({
      filterBy
    }, this.sortAndFilter);
  }

  onLabelSelected = (label) => () => {
    let selectedLabels = { ...this.state.selectedLabels };

    selectedLabels[label] = !selectedLabels[label];
    this.setState({
      selectedLabels
    }, this.sortAndFilter);
  }

  selectComments = () => {
    this.setState({
      isCommentLabelSelected: !this.state.isCommentLabelSelected
    }, this.sortAndFilter);
  }

  onJumpToComment = (comment) => () => {
    this.setPage(this.pdfNumberFromId(comment.documentId));
    this.props.onScrollToComment(comment);
  }

  onCommentScrolledTo = () => {
    this.props.onScrollToComment(null);
  }

  getFilteredDocuments = () => {
    const activeCategoryFilters = _(this.props.documentFilters.category).
      toPairs().
      filter((([key, value]) => value)).
      map(([key, value]) => categoryFieldNameOfCategoryName(key)).
      value();

    return _.filter(
      this.props.storeDocuments,
      (doc) => !activeCategoryFilters.length || _.every(activeCategoryFilters, (categoryFieldName) => doc[categoryFieldName])
    );
  }

  render() {
    let {
      sortDirection
    } = this.state;

    const documents = this.getFilteredDocuments();
    const shouldRenderPdf = this.props.currentRenderedFile !== null;

    const activeDocIndex = _.findIndex(documents, { id: this.props.currentRenderedFile });
    const showNextPageButton = activeDocIndex + 1 < _.size(documents);
    const showPreviousPageButton = activeDocIndex > 0;

    const activeDoc = documents[activeDocIndex];

    return (
      <div className="section--document-list">
        {!shouldRenderPdf && <PdfListView
          annotationStorage={this.annotationStorage}
          documents={documents}
          changeSortState={this.changeSortState}
          showPdf={this.showPdf}
          showPdfAndJumpToPage={this.showPdfAndJumpToPage}
          sortDirection={sortDirection}
          numberOfDocuments={this.props.appealDocuments.length}
          onFilter={this.onFilter}
          filterBy={this.state.filterBy}
          sortBy={this.state.sortBy}
          selectedLabels={this.state.selectedLabels}
          selectLabel={this.onLabelSelected}
          selectComments={this.selectComments}
          isCommentLabelSelected={this.state.isCommentLabelSelected}
          onJumpToComment={this.onJumpToComment} />}
        {shouldRenderPdf && <PdfViewer
          addNewTag={this.props.addNewTag}
          removeTag={this.props.removeTag}
          showTagErrorMsg={this.props.ui.pdfSidebar.showTagErrorMsg}
          annotationStorage={this.annotationStorage}
          file={this.documentUrl(activeDoc)}
          doc={activeDoc}
          showNextPageButton={showNextPageButton}
          showPreviousPageButton={showPreviousPageButton}
          onShowList={this.onShowList}
          pdfWorker={this.props.pdfWorker}
          label={activeDoc.label}
          onJumpToComment={this.onJumpToComment}
          onCommentScrolledTo={this.onCommentScrolledTo} />}
      </div>
    );
  }
}

DecisionReviewer.propTypes = {
  annotations: PropTypes.arrayOf(PropTypes.object),
  appealDocuments: PropTypes.arrayOf(PropTypes.object).isRequired,
  pdfWorker: PropTypes.string,
  onScrollToComment: PropTypes.func,
  onCommentScrolledTo: PropTypes.func,
  handleSetLastRead: PropTypes.func.isRequired
};

const mapStateToProps = (state) => {
  return {
    ui: {
      pdfSidebar: {
        showTagErrorMsg: state.ui.pdfSidebar.showTagErrorMsg
      }
    },
    currentRenderedFile: state.ui.pdf.currentRenderedFile,
    documentFilters: state.ui.pdfList.filters,
    storeDocuments: state.documents
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ReaderActions, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(DecisionReviewer);
