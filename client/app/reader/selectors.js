import { createSelector } from 'reselect';
import _ from 'lodash';
import { getAnnotationsByDocumentId } from './utils';

const getFilteredDocIds = (state) => state.ui.filteredDocIds;
const getAllDocs = (state) => state.documents;

export const getFilteredDocuments = createSelector(
  [getFilteredDocIds, getAllDocs],
  (filteredDocIds, allDocs) => filteredDocIds ?
      _.map(filteredDocIds, (docId) => allDocs[docId]) :
      _.values(allDocs)
);

const getEditingAnnotations = (state) => state.editingAnnotations;
const getPendingEditingAnnotations = (state) => state.ui.pendingEditingAnnotations;
const getAnnotations = (state) => state.annotations;
const getPendingAnnotations = (state) => state.ui.pendingAnnotations;

export const getAnnotationsPerDocuments = createSelector(
  [getFilteredDocuments, getEditingAnnotations, getPendingEditingAnnotations, getAnnotations, getPendingAnnotations],
  (documents, editingAnnotations, pendingEditingAnnotations, annotations, pendingAnnotations) => _(documents).
      keyBy('id').
      mapValues((doc) => getAnnotationsByDocumentId(editingAnnotations, pendingEditingAnnotations, annotations, pendingAnnotations, doc.id)).
      value()
);
