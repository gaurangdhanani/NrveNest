import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  ImageBackground,
  SafeAreaView,
  TextInput,
  Keyboard,
  FlatList,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityType } from './types';

type WordEvent = {
  word: string;
  duration: number;
};

const { width, height } = Dimensions.get('window');

// Color palette matching with the main app
const COLORS = {
  primary: '#edb240',    // Golden/amber color
  bob: '#FFFFC5',
  background: '#f5f2f0', // Light beige
  text: '#4a4a4a',       // Dark gray
  accent1: '#a2d2ff',    // Light blue
  accent2: '#ff8fab',    // Pink
  accent3: '#9bf6ff',    // Light cyan
  accent4: '#ffccac',    // Light orange
  positive: '#7ed957',   // Positive green
  card: 'rgba(255, 255, 255, 0.8)',
  overlay: 'rgba(255, 255, 255, 0.7)',
  white: '#FFFFFF',      
};

// Mindfulness themes
const THEMES = [
  {
    name: "Calm",
    color: COLORS.accent1,
    words: [
      "peace", "tranquil", "serene", "gentle", "harmony",
      "quiet", "still", "soft", "relaxed", "balanced"
    ]
  },
  {
    name: "Joy",
    color: COLORS.primary,
    words: [
      "happy", "delight", "smile", "laugh", "shine",
      "warmth", "cheer", "bright", "radiant", "playful"
    ]
  },
  {
    name: "Growth",
    color: COLORS.positive,
    words: [
      "bloom", "expand", "develop", "nurture", "flourish",
      "evolve", "thrive", "transform", "improve", "progress"
    ]
  },
  {
    name: "Clarity",
    color: COLORS.accent3,
    words: [
      "focus", "aware", "present", "insight", "mindful",
      "clear", "observant", "attentive", "centered", "conscious"
    ]
  }
];

// Game modes
const GAME_MODES = {
  WORD_FLOW: "word_flow",
  MINDFUL_TYPING: "mindful_typing",
  WORD_ASSOCIATION: "word_association",
};

// Mindfulness quotes
const MINDFULNESS_QUOTES = [
  "Each word is a stepping stone to presence.",
  "The mind becomes clear as water when we focus on one word at a time.",
  "In focused attention, we find tranquility.",
  "Words, when truly seen, become portals to the present moment.",
  "When we're fully attentive to each word, time slows down.",
  "Notice how words appear and dissolve, just like thoughts.",
  "Reading with awareness calms the busy mind.",
  "Each word is an invitation to return to the now.",
];

const WordFocusGame = () => {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    EasyCalm: require('../assets/fonts/EasyCalm.ttf'),
  });

  // Game states
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedMode, setSelectedMode] = useState(GAME_MODES.WORD_FLOW);
  const [gameActive, setGameActive] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');
  
  // Word Flow mode
  const [currentWord, setCurrentWord] = useState('');
  const [nextWord, setNextWord] = useState('');
  const [wordHistory, setWordHistory] = useState<WordEvent[]>([]);
  const [wordAppearTime, setWordAppearTime] = useState(0);
  const [wordSeenCount, setWordSeenCount] = useState(0);
  
  // Mindful Typing mode
  const [targetText, setTargetText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [accuracy, setAccuracy] = useState(100);
  
  // Word Association mode
  const [centerWord, setCenterWord] = useState('');
  const [relatedWords, setRelatedWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const wordOpacity = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Refs
  const inputRef = useRef<TextInput | null>(null); // ✅ tells TS the ref is a TextInput
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef(null);

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedSessions = await AsyncStorage.getItem('wordfocus_sessions');
        if (savedSessions) {
          setCompletedSessions(JSON.parse(savedSessions));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    
    loadSavedData();
    
    // Select a random quote
    selectRandomQuote();
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
    
    return () => {
      clearAllTimers();
    };
  }, []);
  
  // Clear all timers
  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
  };
  
  // Select a random mindfulness quote
  const selectRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * MINDFULNESS_QUOTES.length);
    setCurrentQuote(MINDFULNESS_QUOTES[randomIndex]);
  };

  // Start a new game session
  const startGame = () => {
    setGameActive(true);
    setGameComplete(false);
    setScore(0);
    setSessionTime(0);
    setWordHistory([]);
    setSelectedWords([]);
    
    // Set up based on selected mode
    switch (selectedMode) {
      case GAME_MODES.WORD_FLOW:
        startWordFlowMode();
        break;
      case GAME_MODES.MINDFUL_TYPING:
        startMindfulTypingMode();
        break;
      case GAME_MODES.WORD_ASSOCIATION:
        startWordAssociationMode();
        break;
    }
    
    // Start session timer
    timerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
  };
  
  // Start Word Flow mode
  const startWordFlowMode = () => {
    setWordSeenCount(0);
    showNextWord();
  };
  
  // Show the next word in Word Flow mode
  const showNextWord = () => {
    // Get a random word from the selected theme
    const words = selectedTheme.words;
    let newWord = words[Math.floor(Math.random() * words.length)];
    
    // Make sure it's not the same as the current word
    while (newWord === currentWord) {
      newWord = words[Math.floor(Math.random() * words.length)];
    }
    
    // Fade out current word
    Animated.timing(wordOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // Set new word
      setCurrentWord(newWord);
      setWordAppearTime(Date.now());
      
      // Fade in new word
      Animated.timing(wordOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Schedule next word
      wordTimerRef.current = setTimeout(() => {
        if (gameActive) {
          // Record word in history
          setWordHistory(prev => [...prev, {
            word: newWord,
            duration: 5000 // Time word was shown
          }]);
          
          setWordSeenCount(prev => prev + 1);
          
          // Check if we've shown enough words
          if (wordSeenCount >= 20) {
            // End game after 20 words
            endGame();
          } else {
            showNextWord();
          }
        }
      }, 5000); // Word visible for 5 seconds
    });
  };
  
  // Start Mindful Typing mode
  const startMindfulTypingMode = () => {
    // Create a sentence from the theme words
    const words = selectedTheme.words;
    const randomWords = [];
    
    // Get 8 random words
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      randomWords.push(words[randomIndex]);
    }
    
    // Create sentence
    const sentence = `Take a moment to focus on these words: ${randomWords.join(', ')}.`;
    setTargetText(sentence);
    setTypedText('');
    
    // Focus on text input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 1000);
  };
  
  // Handle text input change
  const handleTextChange = (text:string) => {
    setTypedText(text);
    
    // Calculate accuracy
    const targetLength = Math.min(text.length, targetText.length);
    let correctChars = 0;
    
    for (let i = 0; i < targetLength; i++) {
      if (text[i] === targetText[i]) {
        correctChars++;
      }
    }
    
    const accuracyPercent = text.length > 0 
      ? Math.floor((correctChars / text.length) * 100) 
      : 100;
    
    setAccuracy(accuracyPercent);
    
    // Check if completed
    if (text === targetText) {
      endGame();
    }
  };
  
  // Start Word Association mode
  const startWordAssociationMode = () => {
    // Select a center word
    const centerIndex = Math.floor(Math.random() * selectedTheme.words.length);
    const center = selectedTheme.words[centerIndex];
    setCenterWord(center);
    
    // Get other theme words as related words
    const related = THEMES.flatMap(theme => theme.words)
                       .filter(word => word !== center)
                       .sort(() => 0.5 - Math.random())
                       .slice(0, 12); // Get 12 random words
    
    setRelatedWords(related);
    setSelectedWords([]);
  };
  
  // Handle word selection in Word Association mode
  const handleWordSelection = (word:string) => {
    // Toggle word selection
    if (selectedWords.includes(word)) {
      setSelectedWords(prev => prev.filter(w => w !== word));
    } else {
      setSelectedWords(prev => [...prev, word]);
      
      // Add points for selecting a word from the same theme
      if (selectedTheme.words.includes(word)) {
        setScore(prev => prev + 10);
      }
    }
    
    // End game after selecting 5 words
    if (selectedWords.length >= 4) {
      // Schedule end game after a short delay
      setTimeout(() => {
        endGame();
      }, 1000);
    }
  };

  // End the game
  const endGame = async () => {
    setGameActive(false);
    setGameComplete(true);
    
    // Clear timers
    clearAllTimers();
    
    // Calculate final score based on mode
    let finalScore = score;
    
    if (selectedMode === GAME_MODES.MINDFUL_TYPING) {
      // Score based on accuracy and speed
      finalScore = Math.floor(accuracy * (1 + (500 / sessionTime)));
    } else if (selectedMode === GAME_MODES.WORD_FLOW) {
      // Score based on number of words viewed mindfully
      finalScore = wordSeenCount * 10;
    }
    
    setScore(finalScore);
    
    // Save progress
    const newCompleted = completedSessions + 1;
    setCompletedSessions(newCompleted);
    
    try {
      await AsyncStorage.setItem('wordfocus_sessions', JSON.stringify(newCompleted));
      
      // Update quest progress
      const questsData = await AsyncStorage.getItem('quests');
      if (questsData) {
        const quests = JSON.parse(questsData);
        
        // Update the quest progress (3 sessions = 1 step)
        quests.meditationSteps = Math.floor(newCompleted / 3);
        
        // Mark quest as complete after 9 sessions (3 steps)
        if (quests.meditationSteps >= 3) {
          quests[ActivityType.MEDITATION] = true;
        }
        
        await AsyncStorage.setItem('quests', JSON.stringify(quests));
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds:number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Loading screen
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Word Focus...</Text>
      </View>
    );
  }

  // Render home screen
  const renderHomeScreen = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.titleText}>Word Flow</Text>
      <Text style={styles.subtitleText}>A mindful focus experience</Text>
      
      <Animated.View 
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim
          }
        ]}
      >
        <Text style={styles.cardTitle}>Choose Your Practice</Text>
        <Text style={styles.cardDescription}>
          Select a mode to begin your mindfulness practice with words
        </Text>
        
        <View style={styles.modeSelectionContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === GAME_MODES.WORD_FLOW && styles.selectedMode
            ]}
            onPress={() => setSelectedMode(GAME_MODES.WORD_FLOW)}
          >
            <Text style={styles.modeTitle}>Word Flow</Text>
            <Text style={styles.modeDescription}>Observe words as they appear and disappear</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === GAME_MODES.MINDFUL_TYPING && styles.selectedMode
            ]}
            onPress={() => setSelectedMode(GAME_MODES.MINDFUL_TYPING)}
          >
            <Text style={styles.modeTitle}>Mindful Typing</Text>
            <Text style={styles.modeDescription}>Type with attention and presence</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === GAME_MODES.WORD_ASSOCIATION && styles.selectedMode
            ]}
            onPress={() => setSelectedMode(GAME_MODES.WORD_ASSOCIATION)}
          >
            <Text style={styles.modeTitle}>Word Connection</Text>
            <Text style={styles.modeDescription}>Select words that feel connected to the center</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary }]}
          onPress={() => setCurrentScreen('themes')}
        >
          <Text style={styles.buttonText}>Choose Theme</Text>
        </TouchableOpacity>
      </Animated.View>
      
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>{currentQuote}</Text>
      </View>
      
    </View>
  );

  // Render theme selection screen
  const renderThemeScreen = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.titleText}>Choose a Theme</Text>
      <Text style={styles.subtitleText}>Select a word theme for your practice</Text>
      
      <View style={styles.themesContainer}>
        {THEMES.map(theme => (
          <TouchableOpacity
          key={theme.name}
          style={[
            styles.themeCard,
            selectedTheme.name === theme.name && styles.selectedThemeCard,
            { borderColor: theme.color }
          ]}
          onPress={() => setSelectedTheme(theme)}
        >
          <Text style={[styles.themeTitle, { color: theme.color }]}>
            {theme.name}
          </Text>
          <Text style={styles.themeDescription}>
            {theme.words.slice(0, 5).join(', ')}...
          </Text>
        </TouchableOpacity>
        
        
        ))}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary }]}
          onPress={startGame}
        >
          <Text style={styles.buttonText}>Begin Practice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          onPress={() => setCurrentScreen('home')}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Word Flow mode
  const renderWordFlowMode = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameTimeText}>{formatTime(sessionTime)}</Text>
        <Text style={styles.gameCounterText}>Words: {wordSeenCount}/20</Text>
      </View>
      
      <View style={styles.wordFlowContainer}>
        <Text style={styles.instructionText}>
          Observe each word. Notice how it appears and fades away.
        </Text>
        
        <Animated.View 
          style={[
            styles.wordContainer,
            { opacity: wordOpacity }
          ]}
        >
          <Text style={[styles.flowWord, { color: selectedTheme.color }]}>
            {currentWord}
          </Text>
        </Animated.View>
        
        <Text style={styles.breatheText}>
          Breathe in... Breathe out...
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
        onPress={endGame}
      >
        <Text style={styles.buttonText}>End Practice</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render Mindful Typing mode
  const renderMindfulTypingMode = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameTimeText}>{formatTime(sessionTime)}</Text>
        <Text style={styles.gameAccuracyText}>Accuracy: {accuracy}%</Text>
      </View>
      
      <View style={styles.typingContainer}>
        <Text style={styles.instructionText}>
          Type the text below with full awareness of each key press.
        </Text>
        
        <View style={styles.targetTextContainer}>
          <Text style={styles.targetText}>{targetText}</Text>
        </View>
        
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={typedText}
          onChangeText={handleTextChange}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Type here with mindful awareness..."
        />
      </View>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
        onPress={endGame}
      >
        <Text style={styles.buttonText}>End Practice</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render Word Association mode
  const renderWordAssociationMode = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameTimeText}>{formatTime(sessionTime)}</Text>
        <Text style={styles.gameScoreText}>Score: {score}</Text>
      </View>
      
      <View style={styles.associationContainer}>
        <Text style={styles.instructionText}>
          Select words that feel connected to the center word.
        </Text>
        
        <View style={styles.centerWordContainer}>
          <Text style={[styles.centerWord, { color: selectedTheme.color }]}>
            {centerWord}
          </Text>
        </View>
        
        <Text style={styles.selectionText}>
          Select up to 5 related words ({selectedWords.length}/5):
        </Text>
        
        <View style={styles.relatedWordsContainer}>
          {relatedWords.map(word => (
            <TouchableOpacity
              key={word}
              style={[
                styles.relatedWordButton,
                selectedWords.includes(word) && { backgroundColor: selectedTheme.color }
              ]}
              onPress={() => handleWordSelection(word)}
              disabled={selectedWords.length >= 5 && !selectedWords.includes(word)}
            >
              <Text 
                style={[
                  styles.relatedWordText,
                  selectedWords.includes(word) && { color: COLORS.white }
                ]}
              >
                {word}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
        onPress={endGame}
      >
        <Text style={styles.buttonText}>End Practice</Text>
      </TouchableOpacity>
    </View>
  );

  // Render active game screen based on selected mode
  const renderGameScreen = () => {
    switch (selectedMode) {
      case GAME_MODES.WORD_FLOW:
        return renderWordFlowMode();
      case GAME_MODES.MINDFUL_TYPING:
        return renderMindfulTypingMode();
      case GAME_MODES.WORD_ASSOCIATION:
        return renderWordAssociationMode();
      default:
        return null;
    }
  };

  // Render game completion screen
  const renderCompletionScreen = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.titleText}>Practice Complete</Text>
      <Text style={styles.subtitleText}>Reflect on your experience</Text>
      
      <View style={styles.completionCard}>
        <Text style={styles.completionTitle}>Mindful Moments</Text>
        
        <View style={styles.completionStats}>
          <Text style={styles.statItem}>Duration: {formatTime(sessionTime)}</Text>
          
          {selectedMode === GAME_MODES.MINDFUL_TYPING && (
            <Text style={styles.statItem}>Accuracy: {accuracy}%</Text>
          )}
          
          {selectedMode === GAME_MODES.WORD_FLOW && (
            <Text style={styles.statItem}>Words observed: {wordSeenCount}</Text>
          )}
          
          {selectedMode === GAME_MODES.WORD_ASSOCIATION && (
            <Text style={styles.statItem}>Words connected: {selectedWords.length}</Text>
          )}
          
          <Text style={styles.statItem}>Theme: {selectedTheme.name}</Text>
          <Text style={styles.statItem}>Practices completed: {completedSessions}</Text>
        </View>
        
        <Text style={styles.reflectionText}>
          Take a moment to notice how you feel now compared to when you started.
        </Text>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary }]}
          onPress={() => {
            setCurrentScreen('home');
            setGameComplete(false);
          }}
        >
          <Text style={styles.buttonText}>New Practice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render current screen based on game state
  const renderCurrentScreen = () => {
    if (gameActive) return renderGameScreen();
    if (gameComplete) return renderCompletionScreen();
    
    switch (currentScreen) {
      case 'themes':
        return renderThemeScreen();
      case 'home':
      default:
        return renderHomeScreen();
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/Bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <Animated.View 
          style={[
            styles.content, 
            { opacity: fadeAnim }
          ]}
        >
          {renderCurrentScreen()}
          
          {/* Back button (only on certain screens) */}
          {!gameActive && !gameComplete && currentScreen !== 'home' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={styles.backButtonText}>←Back</Text>
            </TouchableOpacity>
          )}
          
          {currentScreen === 'home' && !gameActive && !gameComplete && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←Back</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%"
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  titleText: {
    fontFamily: 'EasyCalm',
    fontSize: 36,
    color: COLORS.primary,
    marginTop: 80,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'transparent', // ✅ remove gray box
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: 'transparent', // ✅ remove shadow
    elevation: 0,               // ✅ remove elevation
  },
  
  cardTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 10,
  },
  cardDescription: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  quoteContainer: {
    marginTop: 30,
    marginHorizontal: 20,
    marginBottom: 30
  },
  quoteText: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    color: COLORS.text,

    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  statsText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 30,
    marginHorizontal: 10,
  },
  buttonText: {
    fontFamily: 'EasyCalm',
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  
  backButtonText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
  },
  modeSelectionContainer: {
    width: '100%',
    marginBottom: 20,
  },
  modeButton: {
    backgroundColor: COLORS.overlay,
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
  },
  selectedMode: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  modeTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 5,
  },
  modeDescription: {
    fontFamily: 'EasyCalm',
    fontSize: 14,
    color: COLORS.text,
  },
  themesContainer: {
    width: '100%',
    marginTop: 20,
  },
  themeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
  },
  selectedTheme: {
    backgroundColor: COLORS.overlay,
  },
  themeTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 20,
    marginBottom: 5,
  },
  themeDescription: {
    fontFamily: 'EasyCalm',
    fontSize: 14,
    color: COLORS.text,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gameTimeText: {
    fontFamily: 'Helvetica',
    fontSize: 18,
    color: COLORS.text,
  },
  gameCounterText: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
  },
  gameAccuracyText: {
    fontFamily: 'Helvetica',
    fontSize: 18,
    color: COLORS.text,
  },
  gameScoreText: {
    fontFamily: 'Helvetica',
    fontSize: 18,
    color: COLORS.text,
  },
  wordFlowContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  instructionText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  wordContainer: {
    marginVertical: 20,
  },
  flowWord: {
    fontFamily: 'EasyCalm',
    fontSize: 36,
    textAlign: 'center',
  },
  breatheText: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 10,
  },
  typingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  targetTextContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  targetText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'EasyCalm',
    minHeight: 100,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  associationContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centerWordContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    marginBottom: 20,
  },
  centerWord: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    textAlign: 'center',
  },
  selectionText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  relatedWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  relatedWordButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.overlay,
    borderRadius: 20,
    margin: 5,
  },
  relatedWordText: {
    fontFamily: 'EasyCalm',
    fontSize: 14,
    color: COLORS.text,
  },
  completionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  completionTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 10,
  },
  completionStats: {
    marginBottom: 20,
  },
  statItem: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
  },
  reflectionText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  selectedThemeCard: {
    backgroundColor: COLORS.bob, // Highlight with yellow
    borderWidth: 2,
  },
  
});

export default WordFocusGame;
