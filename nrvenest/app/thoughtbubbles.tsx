// src/app/thoughtbubbles.tsx

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
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityType } from './types';
import * as Haptics from 'expo-haptics';


const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#edb240',    // Golden/amber color
  background: '#f5f2f0', // Light beige
  text: '#4a4a4a',       // Dark gray
  bubble1: '#ff8fab',    // Pink
  bubble2: '#a2d2ff',    // Light blue
  bubble3: '#9bf6ff',    // Light cyan
  bubble4: '#ffccac',    // Light orange
  positive: '#7ed957',   // Positive green
  white: '#FFFFFF',      

};

// Negative thoughts to reframe
const NEGATIVE_THOUGHTS = [
  "I'm not good enough",
  "I always make mistakes",
  "Nobody cares about me",
  "I'll never get better",
  "Everything is too hard",
  "I can't handle this",
  "I'm a failure",
  "I'm stuck this way forever",
  "No one understands me",
  "This is hopeless",
  "I'm wasting my time",
  "I should be better by now",
];

// Positive reframes for negative thoughts
const POSITIVE_REFRAMES = [
  "I am learning and growing every day",
  "Everyone makes mistakes - they help me improve",
  "I have people in my life who support me",
  "I'm making progress, even if it's small",
  "I can take small steps to make things easier",
  "I've overcome hard things before",
  "I have strengths and abilities",
  "I can change and grow",
  "I can share my feelings with trusted people",
  "There are possibilities I haven't thought of yet",
  "I'm investing in my wellbeing",
  "I'm exactly where I need to be right now",
];

// Game tips
const GAME_TIPS = [
  "Notice negative thoughts without judgment",
  "Even small shifts in thinking can help your mood",
  "Try saying positive thoughts out loud",
  "Collect thought bubbles that feel most helpful to you",
  "Practice makes reframing thoughts easier over time",
];

const ThoughtBubbleGame: React.FC = () => {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    EasyCalm: require('../assets/fonts/EasyCalm.ttf'),
  });

  // Game state
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [completedGames, setCompletedGames] = useState<number>(0);
  const [questCompleted, setQuestCompleted] = useState<boolean>(false);
  const [currentThought, setCurrentThought] = useState<string>("");
  const [currentReframe, setCurrentReframe] = useState<string>("");
  const [activeBubbles, setActiveBubbles] = useState<Array<{id: number, x: number, y: number, size: number, color: string, text: string, velocity: {x: number, y: number}, popped: boolean}>>([]);
  const [gameStartCountdown, setGameStartCountdown] = useState<number>(3);
  const [countdownActive, setCountdownActive] = useState<boolean>(false);
  const [gameTip, setGameTip] = useState<string>(GAME_TIPS[0]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const thoughtOpacity = useRef(new Animated.Value(0)).current;
  const reframeScale = useRef(new Animated.Value(0.8)).current;
  
  // Countdown timer ref
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const animationRef = useRef<number | null>(null);

useEffect(() => {
  if (!gameActive) return;

  const animate = () => {
    setActiveBubbles(prevBubbles =>
      prevBubbles.map(bubble => {
        if (bubble.popped) return bubble;

        let newX = bubble.x + bubble.velocity.x;
        let newY = bubble.y + bubble.velocity.y;

        bubble.velocity.x *= 0.99;
        bubble.velocity.y *= 0.99;


        // Bounce off walls
        if (newX < 0 || newX > width - bubble.size) {
          bubble.velocity.x *= -1;
          newX = bubble.x + bubble.velocity.x;
        }
        if (newY < 0 || newY > height - bubble.size - 200) {
          bubble.velocity.y *= -1;
          newY = bubble.y + bubble.velocity.y;
        }

        return {
          ...bubble,
          x: newX,
          y: newY
        };
      })
    );
    animationRef.current = requestAnimationFrame(animate);
  };

  animationRef.current = requestAnimationFrame(animate);
  return () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };
}, [gameActive]);


  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = await AsyncStorage.getItem('thoughtBubblesProgress');
        if (savedProgress) {
          setCompletedGames(JSON.parse(savedProgress));
        }
        
        // Check if quest is already completed
        const questsData = await AsyncStorage.getItem('quests');
        if (questsData) {
          const quests = JSON.parse(questsData);
          if (quests[ActivityType.THOUGHT_BUBBLES]) {
            setQuestCompleted(true);
          }
        }
        
        // Select random tip
        const randomTip = GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)];
        setGameTip(randomTip);
      } catch (error) {
        console.error('Failed to load thought bubbles progress:', error);
      }
    };
    
    loadProgress();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Start a new game level
  const startGameLevel = () => {
    setGameActive(true);
    setCountdownActive(true);
    setGameStartCountdown(3);
    
    // Start countdown
    countdownRef.current = setInterval(() => {
      setGameStartCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setCountdownActive(false);
          
          // Select a random negative thought
          const randomIndex = Math.floor(Math.random() * NEGATIVE_THOUGHTS.length);
          setCurrentThought(NEGATIVE_THOUGHTS[randomIndex]);
          setCurrentReframe(POSITIVE_REFRAMES[randomIndex]);
          
          // Animate thought appearance
          Animated.timing(thoughtOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
          
          // Start generating bubbles
          generateBubbles();
          
          // Set game timer
          gameTimerRef.current = setTimeout(() => {
            endGameLevel();
          }, 25000); // 25 seconds per level
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Generate thought bubbles randomly across the screen
  const generateBubbles = () => {
    const bubblesCount = 5 + currentLevel * 2; // More bubbles for higher levels
    const bubbleColors = [COLORS.bubble1, COLORS.bubble2, COLORS.bubble3, COLORS.bubble4];
    
    const reframeParts = currentReframe.split(' ');
    const singleWords = [...reframeParts]; 
    const wordPairs = [];
    
    // Create word pairs for longer phrases
    for (let i = 0; i < reframeParts.length - 1; i++) {
      wordPairs.push(`${reframeParts[i]} ${reframeParts[i+1]}`);
    }
    
    // Mix single words and word pairs
    const bubbleTexts = [...singleWords, ...wordPairs];
    
    // Add some distractor words that aren't part of the positive reframe
    const distractors = [
      "never", "always", "can't", "won't", 
      "impossible", "hopeless", "failure", 
      "terrible", "worst", "bad", "negative",
      "fear", "worry", "doubt", "problem"
    ];
    
    // Create a set of bubble content with the right mix of words
    const finalBubbleContent = [];
    
    // First add all the actual words/phrases from the reframe
    for (let i = 0; i < reframeParts.length; i++) {
      finalBubbleContent.push(reframeParts[i]);
    }
    
    // Then add some word pairs if there's room
    for (let i = 0; i < Math.min(3, wordPairs.length); i++) {
      finalBubbleContent.push(wordPairs[i]);
    }
    
    // Fill the rest with distractor words
    while (finalBubbleContent.length < bubblesCount) {
      const randomDistractor = distractors[Math.floor(Math.random() * distractors.length)];
      finalBubbleContent.push(randomDistractor);
    }
    
    // Shuffle the array
    const shuffledContent = [...finalBubbleContent].sort(() => 0.5 - Math.random());
    
    // Create bubble objects
    const newBubbles = [];
    for (let i = 0; i < bubblesCount; i++) {
      const bubbleSize = Math.random() * 30 + 60; // Random size between 60 and 90
      newBubbles.push({
        id: i,
        x: Math.random() * (width - bubbleSize),
        y: Math.random() * (height/2) + height/4,
        size: bubbleSize,
        color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
        text: shuffledContent[i],
        velocity: { 
          x: (Math.random() - 0.5) * 2, 
          y: (Math.random() - 0.5) * 2 
        },
        popped: false
      });
    }
    
    setActiveBubbles(newBubbles);
  };

  // Handle bubble press
  const popBubble = (id: number) => {
    // Check if the bubble contains a word from the positive reframe
    const bubble = activeBubbles.find(b => b.id === id);
    if (!bubble || bubble.popped) return;
    
    // Check if this bubble's text is part of the positive reframe
    const isPartOfReframe = currentReframe.toLowerCase().includes(bubble.text.toLowerCase());
    
    // Update score
    if (isPartOfReframe) {
      setScore(prev => prev + 10);
      
      // Animate reframe scale to give feedback
      reframeScale.setValue(1.2);
      Animated.spring(reframeScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      // Penalty for popping wrong bubbles
      setScore(prev => Math.max(0, prev - 5));
    }
    
    // Mark bubble as popped
    setActiveBubbles(prev => 
      prev.map(bubble => 
        bubble.id === id 
          ? {...bubble, popped: true} 
          : bubble
      )
    );
    
    // Haptic feedback
    Haptics.impactAsync(
      isPartOfReframe 
        ? Haptics.ImpactFeedbackStyle.Medium 
        : Haptics.ImpactFeedbackStyle.Light
    );
    
    // Check if all reframe words are popped
    const updatedBubbles = activeBubbles.map(bubble => 
      bubble.id === id ? {...bubble, popped: true} : bubble
    );
    
    const reframeWords = currentReframe.toLowerCase().split(' ');
    const allReframeWordsPopped = reframeWords.every(word => {
      return updatedBubbles.some(bubble => 
        bubble.text.toLowerCase() === word && bubble.popped
      );
    });
    
    if (allReframeWordsPopped) {
      // End level early if all reframe words are found
      if (gameTimerRef.current) {
        clearTimeout(gameTimerRef.current);
      }
      endGameLevel();
    }
  };

  // End game level
  const endGameLevel = () => {
    setGameActive(false);
    
    // Clean up timers
    if (gameTimerRef.current) {
      clearTimeout(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    
    // Move to next level or end game
    if (currentLevel < 3) {
      setCurrentLevel(prev => prev + 1);
    } else {
      completeGame();
    }
  };

  // Complete the full game (all levels)
  const completeGame = async () => {
    setGameComplete(true);
    
    const newCompleted = completedGames + 1;
    setCompletedGames(newCompleted);
    
    try {
      await AsyncStorage.setItem('thoughtBubblesProgress', JSON.stringify(newCompleted));
      
      // Update quest progress for main screen
      const questsData = await AsyncStorage.getItem('quests');
      let quests = questsData ? JSON.parse(questsData) : {};
      
      // Update the quest progress
      quests.thoughtBubblesSteps = newCompleted;
      
      // If all 3 games are completed, mark the quest as complete
      if (newCompleted >= 3) {
        quests[ActivityType.THOUGHT_BUBBLES] = true;
        await markQuestCompleted();
      }
      
      // Save updated quests
      await AsyncStorage.setItem('quests', JSON.stringify(quests));
    } catch (error) {
      console.error('Failed to save thought bubbles progress:', error);
    }
  };

  const markQuestCompleted = async () => {
    try {
      // Get current quests
      const questsData = await AsyncStorage.getItem('quests');
      let quests = questsData ? JSON.parse(questsData) : {};
      
      // Mark thought bubbles quest as complete
      quests[ActivityType.THOUGHT_BUBBLES] = true;
      
      // Save updated quests
      await AsyncStorage.setItem('quests', JSON.stringify(quests));
      
      // Check if all quests are complete to update streak
      const allComplete = Object.values(quests).every(val => val === true);
      if (allComplete) {
        updateStreak();
      }
    } catch (error) {
      console.error('Failed to mark quest as completed:', error);
    }
  };

  const updateStreak = async () => {
    try {
      const streakData = await AsyncStorage.getItem('streak');
      let streak = streakData ? JSON.parse(streakData) : { currentStreak: 0, lastCompletedDate: null };
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check if this is a consecutive day
      if (streak.lastCompletedDate) {
        const lastDate = new Date(streak.lastCompletedDate);
        const todayDate = new Date(today);
        
        // Calculate difference in days
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          streak.currentStreak += 1;
        } else if (diffDays > 1) {
          // Streak broken
          streak.currentStreak = 1;
        }
      } else {
        // First day of streak
        streak.currentStreak = 1;
      }
      
      // Update last completed date
      streak.lastCompletedDate = today;
      
      // Save updated streak
      await AsyncStorage.setItem('streak', JSON.stringify(streak));
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  };

  // Reset game for a new play session
  const resetGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setGameComplete(false);
    setGameActive(false);
    setActiveBubbles([]);
    
    // Reset animations
    thoughtOpacity.setValue(0);
    reframeScale.setValue(0.8);
  };

  // Loading screen
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Thought Bubbles Game...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/Bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Thought Bubbles</Text>
            <Text style={styles.subtitle}>Completed: {completedGames}/3</Text>
          </View>
          
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          {/* Game Instructions */}
          {!gameActive && !gameComplete && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionTitle}>Pop Thought Bubbles!</Text>
              <Text style={styles.instructionText}>
                Find and pop bubbles with words that create positive thoughts. 
                Build the complete positive reframe to advance!
              </Text>
              
              <View style={styles.tipContainer}>
                <Text style={styles.tipText}>TIP: {gameTip}</Text>
              </View>
              
              {currentLevel === 1 && !gameActive && !gameComplete && (
                <TouchableOpacity
                  style={[styles.startButton, { backgroundColor: COLORS.primary }]}
                  onPress={startGameLevel}
                >
                  <Text style={styles.buttonText}>Start Game</Text>
                </TouchableOpacity>
              )}
              
              {currentLevel > 1 && !gameActive && !gameComplete && (
                <View style={styles.levelContainer}>
                  <Text style={styles.levelText}>Level {currentLevel} of 3</Text>
                  <Text style={styles.scoreText}>Score: {score}</Text>
                  
                  <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: COLORS.primary }]}
                    onPress={startGameLevel}
                  >
                    <Text style={styles.buttonText}>Start Level {currentLevel}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {/* Active Game */}
          {gameActive && (
            <View style={styles.gameContainer}>
              {countdownActive ? (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>{gameStartCountdown}</Text>
                </View>
              ) : (
                <>
                  {/* Negative Thought */}
                  <Animated.View 
                    style={[
                      styles.thoughtContainer, 
                      { opacity: thoughtOpacity }
                    ]}
                  >
                    <Text style={styles.thoughtLabel}>Negative Thought:</Text>
                    <View style={styles.negativeThought}>
                      <Text style={styles.thoughtText}>{currentThought}</Text>
                    </View>
                    
                    <Text style={styles.thoughtLabel}>Positive Reframe:</Text>
                    <Animated.View 
                      style={[
                        styles.positiveReframe,
                        { transform: [{ scale: reframeScale }] }
                      ]}
                    >
                      <Text style={styles.reframeText}>{currentReframe}</Text>
                    </Animated.View>
                  </Animated.View>
                  
                  {/* Game Bubbles */}
                  <View style={styles.bubblesContainer}>
                    {activeBubbles.map(bubble => !bubble.popped && (
                      <TouchableOpacity
                        key={bubble.id}
                        style={[
                          styles.bubble,
                          {
                            left: bubble.x,
                            top: bubble.y,
                            width: bubble.size,
                            height: bubble.size,
                            borderRadius: bubble.size / 2,
                            backgroundColor: bubble.color,
                          }
                        ]}
                        onPress={() => popBubble(bubble.id)}
                      >
                        <Text style={styles.bubbleText}>{bubble.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
          
          {/* Game Complete */}
          {gameComplete && (
            <View style={styles.completeContainer}>
              <Text style={styles.completeTitle}>Game Complete!</Text>
              <Text style={styles.completeText}>
                You've completed the thought reframing exercise with a score of {score}!
              </Text>
              
              <View style={styles.scoreContainer}>
                <Text style={styles.finalScoreText}>Final Score: {score}</Text>
                <Text style={styles.completionText}>Games Completed: {completedGames}/3</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: COLORS.positive }]}
                onPress={() => {
                  resetGame();
                  if (completedGames >= 3) {
                    router.back();
                  }
                }}
              >
                <Text style={styles.buttonText}>
                  {completedGames >= 3 ? 'Return to Home' : 'Play Again'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Quest Completed Message */}
          {questCompleted && (
            <View style={styles.questCompletedContainer}>
              <Text style={styles.completeText}>
                You've completed this quest for today!
              </Text>
              <TouchableOpacity
                style={[styles.backHomeButton, { backgroundColor: COLORS.primary }]}
                onPress={() => router.back()}
              >
                <Text style={styles.buttonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Text style={styles.progressLabel}>Quest Progress</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(completedGames / 3) * 100}%`, 
                    backgroundColor: COLORS.bubble1 
                  }
                ]} 
              />
            </View>
          </View>
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
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'EasyCalm',
    fontSize: 32,
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    zIndex: 10,
  },
  backButtonText: {
    fontFamily: 'EasyCalm',
    color: COLORS.white,
    fontSize: 16,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  instructionTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 10,
  },
  instructionText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  tipContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 15,
    marginVertical: 20,
    width: '100%',
  },
  tipText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  startButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'EasyCalm',
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  levelContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  levelText: {
    fontFamily: 'EasyCalm',
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 10,
  },
  scoreText: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 20,
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontFamily: 'EasyCalm',
    fontSize: 70,
    color: COLORS.primary,
  },
  thoughtContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    marginBottom: 20,
  },
  thoughtLabel: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
  },
  negativeThought: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  thoughtText: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
  },
  positiveReframe: {
    backgroundColor: 'rgba(126, 217, 87, 0.2)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  reframeText: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.positive,
    textAlign: 'center',
  },
  bubblesContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  bubble: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  bubbleText: {
    fontFamily: 'EasyCalm',
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  completeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  },
  completeTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 28,
    color: COLORS.positive,
    marginBottom: 15,
  },
  completeText: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  finalScoreText: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 10,
  },
  completionText: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
  },
  questCompletedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  },
  backHomeButton: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
  },
  progressBarContainer: {
    width: '90%',
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
  progressLabel: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
});

export default ThoughtBubbleGame;