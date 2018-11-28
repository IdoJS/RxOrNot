# Rx Or Not
- Add an input, and search results area using React
- We will search Wikipedia using the input's value
- Should search without having to click a submit button, in other words without any extra user interaction
  other than typing
- Debounce user input for 500 ms
- Search when input value's length is at least 3 chars
- Make sure not to show any old results if search changed
- Don't not send duplicate search requests
- Bonus clear previous results when input's length < 3

You have searchWikipedia function available (searchTerm -> Promise)
