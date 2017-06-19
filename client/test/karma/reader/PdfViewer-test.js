import { expect } from 'chai';
import { getNextAnnotationIconPageCoords } from '../../../app/reader/PdfViewer';
import * as Constants from '../../../app/reader/constants';

describe('PdfViewer', () => {
  describe('getNextAnnotationIconPageCoords', () => {
    describe('allowing movement', () => {
      it('up in the middle of the page', () => {
        expect(
          getNextAnnotationIconPageCoords(
            Constants.MOVE_ANNOTATION_ICON_DIRECTIONS.UP,
            {
              pageIndex: 1,
              x: 100,
              y: 200
            },
            {
              1: {
                width: 1000,
                height: 2000
              }
            }
          )
        ).to.deep.equal({
          x: 100,
          y: 195
        });
      });

      it('down in the middle of the page', () => {
        expect(
          getNextAnnotationIconPageCoords(
            Constants.MOVE_ANNOTATION_ICON_DIRECTIONS.DOWN,
            {
              pageIndex: 1,
              x: 100,
              y: 200
            },
            {
              1: {
                width: 1000,
                height: 2000
              }
            }
          )
        ).to.deep.equal({
          x: 100,
          y: 205
        });
      });

      it('left in the middle of the page', () => {
        expect(
          getNextAnnotationIconPageCoords(
            Constants.MOVE_ANNOTATION_ICON_DIRECTIONS.LEFT,
            {
              pageIndex: 1,
              x: 100,
              y: 200
            },
            {
              1: {
                width: 1000,
                height: 2000
              }
            }
          )
        ).to.deep.equal({
          x: 95,
          y: 200
        });
      });

      it('right in the middle of the page', () => {
        expect(
          getNextAnnotationIconPageCoords(
            Constants.MOVE_ANNOTATION_ICON_DIRECTIONS.RIGHT,
            {
              pageIndex: 1,
              x: 100,
              y: 200
            },
            {
              1: {
                width: 1000,
                height: 2000
              }
            }
          )
        ).to.deep.equal({
          x: 105,
          y: 200
        });
      });
    });
    describe('constraining movement', () => {
      it('up at the top of the page', () => {
        expect(
          getNextAnnotationIconPageCoords(
            Constants.MOVE_ANNOTATION_ICON_DIRECTIONS.UP,
            {
              pageIndex: 1,
              x: 100,
              y: 0
            },
            {
              1: {
                width: 1000,
                height: 2000
              }
            }
          )
        ).to.deep.equal({
          x: 100,
          y: 0
        });
      });

      it('left at the left hand side of the page', () => {
        expect(
          getNextAnnotationIconPageCoords(
            Constants.MOVE_ANNOTATION_ICON_DIRECTIONS.LEFT,
            {
              pageIndex: 1,
              x: 0,
              y: 100
            },
            {
              1: {
                width: 1000,
                height: 2000
              }
            }
          )
        ).to.deep.equal({
          x: 0,
          y: 100
        });
      });

      it('right at the right hand side of the page', () => {
        expect(
          getNextAnnotationIconPageCoords(
            Constants.MOVE_ANNOTATION_ICON_DIRECTIONS.RIGHT,
            {
              pageIndex: 1,
              x: 960,
              y: 300
            },
            {
              1: {
                width: 1000,
                height: 2000
              }
            }
          )
        ).to.deep.equal({
          x: 960,
          y: 300
        });
      });

      it('down at the bottom of the page', () => {
        expect(
          getNextAnnotationIconPageCoords(
            Constants.MOVE_ANNOTATION_ICON_DIRECTIONS.DOWN,
            {
              pageIndex: 1,
              x: 0,
              y: 1960
            },
            {
              1: {
                width: 1000,
                height: 2000
              }
            }
          )
        ).to.deep.equal({
          x: 0,
          y: 1960
        });
      });

    });
  });
});
