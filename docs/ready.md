# Readiness Checklists

This is being piloted by the Whiskey team.

## Checklists

### Ready For Dev
1. Acceptance criteria includes handling for the following (or explicitly stating that they are out of scope or not applicable):
  1. Accessibility
    1. Keyboard operability
    1. Screen-reader usability
  1. Error handling
    1. Invalid / unexpected user input
    1. Server failure
  1. Data persisting to the backend
    1. What actions cause data to be saved?
    1. Is there a loading indicator?
    1. Is there a "save successful" indicator?
  1. Pixel or percentage measurements for layout
  1. Specify all colors used (preferably in terms of semantic variables like `$tag-backgrond-color`)
1. Ensure that all necessary SVGs are linked from the ticket and render correctly in the GitHub browser
1. Mockups and specs
  1. If the mockups and specs are inconsistent with each other, or are out of date, please note this explicitly.
1. Where applicable (for more complicated tickets), please include a brief rationale for this solution to the problem.
1. If a specific component from the styleguide is supposed to be used, please name that component.

### Ready For PR
1. The PR improves the app in some way
1. Tests are passing on Travis
1. New tests are added for new functionality
1. There are no new warnings in the test output
1. There are no new console errors in the browser
1. PR only addresses one ticket, unless:
  * Addressing a separate ticket only requires a small amount (~10 lines) of code.
  * Two tickets are fixed by the same diff / the two tickets really should have been one ticket
  * Some other very good reason
1. Everything (comments, variable names, etc) is spelled correctly using American English
1. Best practices
  1. Redux
    1. No computed state is being stored in Redux
    1. If you're adding new state to Redux, add it to the initial state, even if the initial value is falsey:
    ```js
      initialState = {
        // ...
        myNewValue: null
      }
    ```
    1. All actions are used
    1. All actions have a reducer part that updates the state
  1. Lodash is being used effectively
  1. All variables are scoped as tightly as possible
  1. Class methods all use `this`; if `this` is not needed, it shouldn't be a class method
  1. All CSS colors are variables, not magic values
1. Feedback from previous PRs about style and best practices is applied in this PR as well

## Hypothesis / Rationale
We move tickets through a series of steps. When a ticket is moved to the next step too soon, it causes churn. If we look at these checklists before moving tickets to the next step, we may be able to reduce churn.