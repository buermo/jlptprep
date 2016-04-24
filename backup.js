'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  AsyncStorage
} = React;

var DisplayState = {
  loading: 1,
  wordTest: 2,
  wordDisplayCorrect: 3,
  wordDisplayWrong: 4,
  wordDisplayNotSure: 5
};
var storageKey = 'jlptprep';
var levelSize = 25;


var shuffleArray = function(array) {
  var currentIndex = array.length,
    temporaryValue, randomIndex;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};

var generateWords = function(array) {
  var words = [];
  var currentIndex = array.length - 1;

  while (1 !== currentIndex) {
    var temporaryValue = array[currentIndex];
    var word = {
      id: currentIndex,
      kanji: temporaryValue.kanji,
      kana: temporaryValue.kana,
      meaning: temporaryValue.meaning,
      options: []
    };
    var randomIndex = Math.floor(Math.random() * 4);
    for (var i = 0; i < 4; i++) {
      if (i == randomIndex)
        word.options.push(temporaryValue.meaning);
      else
        word.options.push(array[(currentIndex + i + randomIndex) * (i + 1) % array.length].meaning);
    }
    words.push(word);
    currentIndex -= 1;
  }
  return words;
};

var getAllWords = function() {
  fetch('https://run.plnkr.co/plunks/vCt0ab2CtFEG1Yh1Yjg4/data.json')
    .then((response) => response.text())
    .then((responseText) => {
      this.initLevels(responseText);
    })
    .catch((error) => {
      console.warn(error);
    });
};

var initLevels = function(json) {
    var data = JSON.parse(json);
    var levels = [];
    var levelCount = data.length / levelSize;
    data = this.shuffleArray(data);
    var words = this.generateWords(data);
    for (var i = 0; i < levelCount; i++) {
      levels.push(words.slice(i * levelSize, (i + 1) * levelSize - 1));
    }
    return levels;
  };

var jlptprep = React.createClass({
  componentDidMount() {
    this._loadInitialState().done();
  },

  async _loadInitialState() {
  	var allwords = await AsyncStorage.getItem(storageKey);
  	if (!!value && !!value.levels) {
  	  allwords = getAllWords();
      await AsyncStorage.setItem(storageKey, allwords);
  	}
    this.setState({
      words: cache.levels[1],
      displayState: DisplayState.wordTest
    });
  },

  async _onValueChange(selectedValue) {
    this.setState({selectedValue});
    try {
      await AsyncStorage.setItem(storageKey, selectedValue);
      this._appendMessage('Saved selection to disk: ' + selectedValue);
    } catch (error) {
      this._appendMessage('AsyncStorage error: ' + error.message);
    }
  },

  async _removeStorage() {
    try {
      await AsyncStorage.removeItem(storageKey);
      this._appendMessage('Selection removed from disk.');
    } catch (error) {
      this._appendMessage('AsyncStorage error: ' + error.message);
    }
  },

  getInitialState: function() {
    return {
      displayState: DisplayState.loading,
      words: []
    };
  },
  shuffleWords: function() {
    var array = this.state.words;
    var currentIndex = array.length,
      temporaryValue, randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    this.setState({
      words: array
    });
  },
  handleSelect: function(item, o) {
    if (!o)
      this.setState({
        displayState: DisplayState.wordDisplayNotSure
      });
    else if (item.meaning == o)
      this.setState({
        displayState: DisplayState.wordDisplayCorrect
      });
    else
      this.setState({
        displayState: DisplayState.wordDisplayWrong
      });
    this.forceUpdate();
  },
  handleNext: function(item) {
    var array = this.state.words;
    if (this.state.correctState == 1)
      array.pop();

    this.setState({
      displayState: DisplayState.wordTest,
      words: array
    });
    this.shuffleWords();
    this.forceUpdate();
  },
  render: function() {
    var $this = this;
    var item = this.state.words[this.state.words.length - 1];
    switch ($this.state.displayState) {
      case DisplayState.loading:
        return (<View style={styles.container}>
        <Text>
          LOADING...
        </Text>
      </View>);
      case DisplayState.wordTest:
        return (<View style={styles.bg}>
        <View style={styles.word}>
          <Text style={styles.kanji}>
            {item.kanji}
          </Text>
          <Text style={styles.kana}>
            {item.kana}
          </Text>
        </View>
      <View style={styles.container}>
          {
            item.options.map(function(option) {
              return <View style={styles.option}>
                <TouchableHighlight
                key={option}
                onPress={$this.handleSelect.bind($this, item, option)}>
                  <Text style={styles.optionText}>
                    {option}
                  </Text>
              </TouchableHighlight>
            </View>
            })
          }
          <View style={styles.options}>
          <TouchableHighlight
        key="-1"
        onPress={$this.handleSelect.bind($this, item)}>
        <Text style={styles.optionText}>
          Not sure
        </Text>
      </TouchableHighlight>
          </View>
        </View>
      </View>);
      case DisplayState.wordDisplayCorrect:
        return (<View style={styles.bg}>
        <View style={styles.correct}>
          <Text style={styles.kanji}>
            {item.kanji}
          </Text>
          <Text style={styles.kana}>
            {item.kana}
          </Text>
          <Text style={styles.option}>
            <Text style={styles.optionText}>
                    {item.meaning}
                  </Text>
          </Text>
        </View>
                <View style={styles.options}>
            <TouchableHighlight
        key="0"
        onPress={$this.handleNext.bind($this, item)}>
        <Text style={styles.optionText}>Next</Text>
      </TouchableHighlight></View>
        </View>);
      case DisplayState.wordDisplayWrong:
        return (<View style={styles.bg}>
        <View style={styles.wrong}>
          <Text style={styles.kanji}>
            {item.kanji}
          </Text>
          <Text style={styles.kana}>
            {item.kana}
          </Text>
          <Text style={styles.option}>
            <Text style={styles.optionText}>
                    {item.meaning}
                  </Text>
          </Text>
        </View>
                <View style={styles.options}>
            <TouchableHighlight
        key="0"
        onPress={$this.handleNext.bind($this, item)}>
        <Text style={styles.optionText}>Next</Text>
      </TouchableHighlight></View>
        </View>);
      case DisplayState.wordDisplayNotSure:
        return (<View style={styles.bg}>
        <View style={styles.notsure}>
          <Text style={styles.kanji}>
            {item.kanji}
          </Text>
          <Text style={styles.kana}>
            {item.kana}
          </Text>
          <Text style={styles.option}>
            <Text style={styles.optionText}>
                    {item.meaning}
                  </Text>
          </Text>
        </View>
                <View style={styles.options}>
            <TouchableHighlight
        key="0"
        onPress={$this.handleNext.bind($this, item)}>
        <Text style={styles.optionText}>Next</Text>
      </TouchableHighlight></View>
        </View>);
      default:

        return (<View style={styles.container}>
        <Text>
          LOADING...
        </Text>
      </View>);
    }
  }
});

var styles = StyleSheet.create({
  bg: {
    backgroundColor: 'white',
    flex: 1,
    flexDirection: 'column',
    margin: 20,
    padding: 20,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'stretch'
  },
  word: {
    flex: 2,
    borderBottomWidth: 0.5
      //margin: 20,
  },
  correct: {
    borderColor: 'green',
    flex: 2,
    borderWidth: 4
      //margin: 20,
  },
  wrong: {
    borderColor: 'red',
    flex: 2,
    borderWidth: 4
      //margin: 20,
  },
  notsure: {
    borderColor: 'grey',
    flex: 2,
    borderWidth: 4
      //margin: 20,
  },
  option: {
    flex: 1,
    flexDirection: 'column',
    borderBottomWidth: 0.5,
    margin: 8,
  },
  kanji: {
    fontSize: 28,
    textAlign: 'center'
  },
  kana: {
    fontSize: 28,
    textAlign: 'center'
  },
  optionText: {
    fontSize: 22,
    textAlign: 'left',
    marginLeft: 10,
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('jlptprep', () => jlptprep);
