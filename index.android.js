'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  AsyncStorage,
  ListView
} = React;

var DisplayState = {
  loading: 1,
  wordTest: 2,
  wordDisplayCorrect: 3,
  wordDisplayWrong: 4,
  wordDisplayNotSure: 5,
  levelDisplay: 6,
  levelComplete: 7
};
var storageKey = 'jlptprep-allwords';
var levelProgressKey = 'jlptprep-levelprogress';
var levelSize = 20;

var jlptprep = React.createClass({
  componentDidMount() {
    this._loadInitialState().done();
  },

  async _loadInitialState() {
    var json = await AsyncStorage.getItem(storageKey);
    if (json == null) {
      this.getJSON();
    } else {
      var allwords = this.initLevels(json);
      var level = await AsyncStorage.getItem(levelProgressKey);
      this.setState({
        allwords: allwords,
        displayState: DisplayState.levelDisplay,
        level: level ? parseInt(level) : 0,
        levelDs: this.getLevelDs(allwords.levels.length)
      });
      this.scrollToLevel();
    }
  },

  async _saveLevelProgress() {
    await AsyncStorage.setItem(levelProgressKey, this.state.level);
  },

  getLevelDs(length) {
    var ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });
    var array = [];
    for (var i = 0; i < length; i++) array.push(i);
    return ds.cloneWithRows(array)
  },

  getJSON: function() {
    require('res/n1.json')
      .then((response) => response.text())
      .then(async(responseText) => {
        await AsyncStorage.setItem(storageKey, responseText);
        var allwords = this.initLevels(responseText);
        this.setState({
          allwords: allwords,
          displayState: DisplayState.levelDisplay,
          levelDs: this.getLevelDs(allwords.levels.length)
        });
        this.scrollToLevel();
      })
      .catch((error) => {
        console.warn(error);
      });
  },
  initLevels: function(json) {
    var data = JSON.parse(json);
    var levels = [];
    var levelCount = data.length / levelSize;
    console.log('levelCount:'+levelCount);
    data = this.shuffleArray(data);
    var words = this.generateWords(data);
    for (var i = 0; i < levelCount; i++) {
      levels.push(words.slice(i * levelSize, (i + 1) * levelSize - 1));
    }
    return {
      levels: levels
    };
  },
  shuffleArray: function(array) {
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
  },
  generateWords: function(array) {
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
  },
  getInitialState: function() {
    return {
      displayState: DisplayState.loading,
      level: 0
    };
  },
  shuffleWords: function(array) {
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
    if (this.state.displayState == DisplayState.wordDisplayCorrect) {
      array.pop();
      if (array.length == 0) {
        this.setState({
          displayState: DisplayState.levelComplete,
          level: this.state.level + 1
        });
        this._saveLevelProgress();
        return false;
      }
    }
    array = this.shuffleWords(array);
    this.setState({
      displayState: DisplayState.wordTest,
      words: array
    });
  },
  _renderLevelRow: function(rowData: string, sectionID: number, rowID: number) {
    if (rowID < this.state.level)
      return <Text style={styles.levelDone}>You've completed this level.</Text>
    else if (rowID == this.state.level)
      return (<TouchableHighlight
          onPress={() => this._rowPressed(rowID)}>
        <Text style={styles.levelCurrent}>Start</Text>
        </TouchableHighlight>);
    else
      return <Text style={styles.levelLocked}>Complete previous level to unlock.</Text>
  },
  _rowPressed: function(rowID) {
    console.log(rowID);
    this.setState({
      displayState: DisplayState.wordTest,
      words: this.state.allwords.levels[rowID]
    });
  },
  scrollToLevel: function() {
    if (this.state.displayState == DisplayState.levelDisplay) {
      setTimeout(() => {
        var scrollResponder = this.refs.levels.getScrollResponder();
        scrollResponder.scrollTo({
          y: this.state.level * 300
        });
        console.log('scrolled');
      }, 100);
    }
  },
  handleLevelComplete: function() {
	  this.setState({displayState:DisplayState.levelDisplay});
  },
  render: function() {
    var $this = this;
    switch ($this.state.displayState) {
      case DisplayState.loading:
        return (<View style={styles.container}>
        <Text>
          LOADING...
        </Text>
      </View>);
      case DisplayState.levelDisplay:
        return (<ListView ref='levels'
				  dataSource={this.state.levelDs}
				  renderRow={this._renderLevelRow}
          style = {styles.levels}
				/>);
      case DisplayState.levelComplete:
        return (<View>
        <Text>
          Level Completed!
        </Text><TouchableHighlight
          onPress={this.handleLevelComplete.bind()}>
        <Text>Next</Text>
        </TouchableHighlight>
      </View>);
      case DisplayState.wordTest:
    var item = this.state.words[this.state.words.length - 1];
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
            item.options.map(function(option, i) {
              return <View style={styles.option}>
                <TouchableHighlight
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
        onPress={$this.handleSelect.bind($this, item)}>
        <Text style={styles.optionText}>
          Not sure
        </Text>
      </TouchableHighlight>
          </View>
        </View>
      </View>);
      case DisplayState.wordDisplayCorrect:
    var item = this.state.words[this.state.words.length - 1];
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
        onPress={$this.handleNext.bind($this, item)}>
        <Text style={styles.correctNext}>Next</Text>
      </TouchableHighlight></View>
        </View>);
      case DisplayState.wordDisplayWrong:
    var item = this.state.words[this.state.words.length - 1];
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
        onPress={$this.handleNext.bind($this, item)}>
        <Text style={styles.wrongNext}>Next</Text>
      </TouchableHighlight></View>
        </View>);
      case DisplayState.wordDisplayNotSure:
    var item = this.state.words[this.state.words.length - 1];
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
  levels: {
    marginTop: 100,
    marginBottom: 100
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
  correctNext: {
    fontSize: 22,
    textAlign: 'center',
    backgroundColor: 'green'
  },
  wrongNext: {
    fontSize: 22,
    textAlign: 'center',
    backgroundColor: 'red'
  },
  levelContainer: {
    borderRadius: 25,
    borderWidth: 2,
  },
  levelLocked: {
    borderRadius: 25,
    borderWidth: 2,
    fontSize: 16,
    backgroundColor: 'grey',
    margin: 30,
    padding: 20,
    alignSelf: 'stretch'
  },
  levelCurrent: {
    borderRadius: 25,
    borderWidth: 2,
    fontSize: 28,
    padding: 20,
    textAlign: 'center',
    alignSelf: 'stretch',
    margin: 30
  },
  levelDone: {
    borderRadius: 25,
    borderWidth: 2,
    padding: 20,
    backgroundColor: 'green',
    fontSize: 16,
    alignSelf: 'stretch',
    margin: 30
  },
});

AppRegistry.registerComponent('jlptprep', () => jlptprep);
