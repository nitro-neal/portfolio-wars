import React from 'react';
import ReactAutocomplete from 'react-autocomplete'

const imageStyle = {width : '30px'}

class MyAutosuggest extends React.Component {
    constructor(props) {
      super(props)
  
      this.state = {
        value: '',
      }
    }

    

    
    componentDidMount() {

    }


    handleKeyDown(e) {
      this.setState({ value: e.target.value })
      console.log('internal key down');
    }



    render() {

        
        return (
            
<ReactAutocomplete
        items={[
          { id: 'ETH', label: 'ETH' },
          { id: 'BAT', label: 'BAT' },
          { id: 'OMG', label: 'OMG' },
        ]}
        shouldItemRender={(item, value) => item.label.toLowerCase().indexOf(value.toLowerCase()) > -1}
        getItemValue={item => item.label}
        renderItem={(item, highlighted) =>
          <div
            key={item.id}
            style={{ backgroundColor: highlighted ? '#eee' : 'transparent'}}
          >

{/* <img alt ="" style ={imageStyle} src={"./logos/" + asset.symbol.toLowerCase() + ".png"} />  */}
            {item.label}
          </div>
        }
        value={this.state.value}
        onChange={e => this({ value: e.target.value })}
        onSelect={value => this.setState({ value })}
        // onKeyDown={this.handleKeyDown}
      />
        );
    }
  }


//   const styles = StyleSheet.create({
//     container: {
//       backgroundColor: '#F5FCFF',
//       flex: 1,
//       padding: 16,
//       marginTop: 40,
//     },
//     autocompleteContainer: {
//       backgroundColor: '#ffffff',
//       borderWidth: 0,
//     },
//     descriptionContainer: {
//       flex: 1,
//       justifyContent: 'center',
//     },
//     itemText: {
//       fontSize: 15,
//       paddingTop: 5,
//       paddingBottom: 5,
//       margin: 2,
//     },
//     infoText: {
//       textAlign: 'center',
//       fontSize: 16,
//     },
//   });

  export default MyAutosuggest;