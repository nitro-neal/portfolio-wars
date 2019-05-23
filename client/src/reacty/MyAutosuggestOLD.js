// import React from 'react';
// import Slider from 'rc-slider';
// import {Container, Row, Col} from 'react-bootstrap';
// import Autosuggest from 'react-autosuggest';
// // import MyAutosuggestTheme from './AutoSuggest.css'


// // Imagine you have a list of languages that you'd like to autosuggest.
// const languages = [
//     {
//       name: 'ETH',
//       year: 1972
//     },
//     {
//       name: 'BAT',
//       year: 2012
//     }
//   ];
  
//   // Teach Autosuggest how to calculate suggestions for any given input value.
//   const getSuggestions = value => {
//     const inputValue = value.trim().toLowerCase();
//     const inputLength = inputValue.length;
  
//     return inputLength === 0 ? [] : languages.filter(lang =>
//       lang.name.toLowerCase().slice(0, inputLength) === inputValue
//     );
//   };
  
//   // When suggestion is clicked, Autosuggest needs to populate the input
//   // based on the clicked suggestion. Teach Autosuggest how to calculate the
//   // input value for every given suggestion.
//   const getSuggestionValue = suggestion => suggestion.name;
  
//   // Use your imagination to render suggestions.
//   const renderSuggestion = suggestion => (
//     <div>
//       {suggestion.name}
//     </div>
//   );

// class MyAutosuggest extends React.Component {
//     constructor(props) {
//       super(props)
  
//       this.state = {
//         value: '',
//         suggestions: []
//       };
//     }

    

    
//     componentDidMount() {

//     }


//   onChange = (event, { newValue }) => {
//     this.setState({
//       value: newValue
//     });
//   };

//   // Autosuggest will call this function every time you need to update suggestions.
//   // You already implemented this logic above, so just use it.
//   onSuggestionsFetchRequested = ({ value }) => {
//     this.setState({
//       suggestions: getSuggestions(value)
//     });
//   };

//   // Autosuggest will call this function every time you need to clear suggestions.
//   onSuggestionsClearRequested = () => {
//     this.setState({
//       suggestions: []
//     });
//   };

//     render() {
//         const { value, suggestions } = this.state;
//         const inputProps = {
//             placeholder: 'Choose Cryptocurrency',
//             value,
//             onChange: this.onChange
//           };

        
        
//         return (
            

//             <Autosuggest
//             suggestions={suggestions}
//             onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
//             onSuggestionsClearRequested={this.onSuggestionsClearRequested}
//             getSuggestionValue={getSuggestionValue}
//             renderSuggestion={renderSuggestion}
//             inputProps={inputProps}
            
//           />
//         );
//     }
//   }


// //   const styles = StyleSheet.create({
// //     container: {
// //       backgroundColor: '#F5FCFF',
// //       flex: 1,
// //       padding: 16,
// //       marginTop: 40,
// //     },
// //     autocompleteContainer: {
// //       backgroundColor: '#ffffff',
// //       borderWidth: 0,
// //     },
// //     descriptionContainer: {
// //       flex: 1,
// //       justifyContent: 'center',
// //     },
// //     itemText: {
// //       fontSize: 15,
// //       paddingTop: 5,
// //       paddingBottom: 5,
// //       margin: 2,
// //     },
// //     infoText: {
// //       textAlign: 'center',
// //       fontSize: 16,
// //     },
// //   });

//   export default MyAutosuggest;