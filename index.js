'user strict';

// module the project with IIFE
(function (React, ReactDOM, Rx, searchWikipedia) {
  /**
   * I've kept it for simplicity sake without using a bundler in a single file.
   *
   * Structure should have been:
   * index.html
   * index.js
   * style.css
   * src
   * _components
   * __Search
   * ___index.js
   * __SearchInput
   * ___index.js
   * __SearchResultList
   * ___index.js
   * _utils
   * __constants.js
   * __subjects.js
   * __script.js
   * ------------------------------------------------
   * Data flow:
   * inputSearchSubject emit input-change event from the SearchInput
   * SearchResultList observe the inputSearchSubject
   * Search observe the inputSearchSubject
   *
   *                                     |-> SearchResultList
   * SearchInput -> inputSearchSubject ->|
   *                                     |-> Search
   *
   * searchResultsSubject emit results-data from the Search
   * SearchResultList observe the searchResultsSubject
   *
   * Search -> searchResultsSubject -> SearchResultList
   *
   * ------------------------------------------------
   * Dependency:
   * babel-standalone: allow es6 syntax + jsx
   * jquery: was missing for the searchWikipedia (didn't want to change the function and I assumed it just missing and not part of the exercise)
   * semantic-ui: style
   */

  const init = () => {

    // src/utils/constants
    const DENOUNCE_SEARCH_MILLISECOND = 500;
    const MIN_STR_LENGTH_SEARCH_WIKI = 3;
    const SEARCH_INPUT_PLACEHOLDER = 'Search...';

    // src/utils/subjects
    // Rx.Subject is used to share data with multi subscribers
    // and it can produces data (aka use .next to emit data)
    const inputSearchSubject = new Rx.Subject();
    const searchResultsSubject = new Rx.Subject();

    // src/components/SearchInput
    const SearchInput = () => {
      // SearchBar onChange stream input values via the inputSearchSubject
      return (<div className='ui fluid icon input'>
        <input type='text' placeholder={SEARCH_INPUT_PLACEHOLDER} onChange={(ev) => inputSearchSubject.next(ev)}/>
        <i className='circular search link icon'></i>
      </div>)
    };

    // src/components/SearchResultList
    class SearchResultList extends React.PureComponent {
      state = {
        results: [],
        showResultFlag: true,
        loader: false
      }

      componentDidMount() {
        this.results$ = searchResultsSubject
         // do handle side effect (set component state)
          .do(({loader, results}) => {
            this.setState({loader, results});
          })
          .subscribe();

        this.toggleResults$ = inputSearchSubject
          .pluck('target', 'value')
          .map(value => value.length >= MIN_STR_LENGTH_SEARCH_WIKI)
          // do handle side effect (set component state)
          .do(showResultFlag => {
            this.setState({
              loader: false,
              showResultFlag
            });
          })
          .subscribe();
      }

      componentWillUnmount() {
        // unsubscribe to prevent memory leak on ummount
        if (this.results$) {
          this.results$.unsubscribe();
        }

        if (this.toggleResults$) {
          this.toggleResults$.unsubscribe();
        }
      }

      render() {
        let view = null;
        if (this.state.loader) {
          view = (<div className='ui segment'>
            <div className='ui active loader'/>
          </div>);
        } else {
          const results = this.state.results.map((item, key) => <div className='item search-list-item'
                                                                     key={key}>{item}</div>);
          view = <div className='ui list'>{this.state.showResultFlag ? results : null}</div>;
        }

        return view
      }
    }

    // src/components/Search
    class Search extends React.Component {

      componentDidMount() {
        this.inputSearch$ = inputSearchSubject
          // pluck get the data from the event object
          .pluck('target', 'value')
          // filter handle unwanted inputs
          .filter(value => value.length >= MIN_STR_LENGTH_SEARCH_WIKI)
          // debounceTime handle the debounce
          .debounceTime(DENOUNCE_SEARCH_MILLISECOND)
          // allow only different value to proceed
          .distinctUntilChanged()
          // do handle side effect (set component state)
          // placing the "do" after "distinctUntilChanged" allow us to show loader only for data
          // that will actually perform the ajax request
          .do(() => searchResultsSubject.next({loader: true, results: []}))
          // switchMap change from event data flow to ajax data flow
          .switchMap(value => Rx.Observable.fromPromise(
            searchWikipedia(value)
          ))
          // do handle side effect (set component state)
          .do((response) => searchResultsSubject.next({
            loader: false,
            results: response && Array.isArray(response) && response.length > 1 ? response[1] : []
          }))
          .subscribe();

      }

      componentWillUnmount() {
        // unsubscribe to prevent memory leak on ummount
        if (this.inputSearch$) {
          this.inputSearch$.unsubscribe();
        }
      }

      render() {
        return (
          <div className='search ui raised very padded text container segment'>
            <h2 className='ui header'>Wiki-Search:</h2>
            <SearchInput/>
            <SearchResultList/>
          </div>
        )
      }
    }

    const rootElement = document.getElementById('root');
    ReactDOM.render(
      <Search/>,
      rootElement
    )

  };

  // wait until window finish loading before init
  window.onload = init();
})(React, ReactDOM, Rx, searchWikipedia);

