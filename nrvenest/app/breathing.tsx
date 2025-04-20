// src/app/breathing.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ImageBackground, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityType } from './types';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#edb240',
  background: '#f5f2f0',
  text: '#4a4a4a',
  accent3: '#9bf6ff',
};

const BREATHING_PATTERNS = [
  { name: "Four-Seven-Eight Technique", inhale: 4, hold: 7, exhale: 8 },
  { name: "Box Breathing", inhale: 4, hold: 4, exhale: 4 },
];

const BreathingQuest: React.FC = () => {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    EasyCalm: require('../assets/fonts/EasyCalm.ttf'),
  });

  const [breathCount, setBreathCount] = useState<number>(0);
  const [breathPhase, setBreathPhase] = useState<string>("inhale");
  const [selectedPattern, setSelectedPattern] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<number>(0);
  const [exerciseComplete, setExerciseComplete] = useState<boolean>(false);
  
  const breathAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = await AsyncStorage.getItem('breathingProgress');
        if (savedProgress) {
          setCompletedExercises(JSON.parse(savedProgress));
        }
      } catch (error) {
        console.error('Failed to load breathing progress:', error);
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

  // Breathing animation
  useEffect(() => {
    const pattern = BREATHING_PATTERNS[selectedPattern];
    
    if (breathPhase === "inhale") {
      Animated.timing(breathAnim, {
        toValue: 1,
        duration: pattern.inhale * 1000,
        useNativeDriver: false,
      }).start(() => {
        setBreathPhase("hold");
      });
    } 
    else if (breathPhase === "hold") {
      Animated.timing(breathAnim, {
        toValue: 1,
        duration: pattern.hold * 1000,
        useNativeDriver: false,
      }).start(() => {
        setBreathPhase("exhale");
      });
    } 
    else if (breathPhase === "exhale") {
      Animated.timing(breathAnim, {
        toValue: 0,
        duration: pattern.exhale * 1000,
        useNativeDriver: false,
      }).start(() => {
        setBreathCount(prev => prev + 1);
        setBreathPhase("inhale");
      });
    }
  }, [breathPhase, selectedPattern]);

  // Check if exercise is complete (3 breaths)
  useEffect(() => {
    if (breathCount >= 3) {
      setExerciseComplete(true);
    }
  }, [breathCount]);

  const completeExercise = async () => {
    if (completedExercises < 3) {
      const newCompleted = completedExercises + 1;
      setCompletedExercises(newCompleted);
      
      try {
        // Save to AsyncStorage
        await AsyncStorage.setItem('breathingProgress', JSON.stringify(newCompleted));
        
        // Update quest progress for main screen
        const questsData = await AsyncStorage.getItem('quests');
        let quests = questsData ? JSON.parse(questsData) : {};
        
        // Update the quest progress
        if (!quests.breathingSteps) quests.breathingSteps = 0;
        quests.breathingSteps = newCompleted;
        
        // If all 3 exercises are completed, mark the quest as complete
        if (newCompleted >= 3) {
          quests[ActivityType.BREATHING] = true;
        }
        
        // Save updated quests
        await AsyncStorage.setItem('quests', JSON.stringify(quests));
        
        // Check for streak update
        if (newCompleted >= 3) {
          await markQuestCompleted();
        }
      } catch (error) {
        console.error('Failed to save breathing progress:', error);
      }
      
      // Reset for next exercise
      setBreathCount(0);
      setBreathPhase("inhale");
      breathAnim.setValue(0);
      setExerciseComplete(false);
    }
    
    // Navigate back if all exercises completed
    if (completedExercises >= 2) {
      router.back();
    }
  };

  const markQuestCompleted = async () => {
    try {
      // Get current quests
      const questsData = await AsyncStorage.getItem('quests');
      let quests = questsData ? JSON.parse(questsData) : {};
      
      // Mark breathing quest as complete
      quests[ActivityType.BREATHING] = true;
      
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
      
      // Reset quest completion for next day
      await AsyncStorage.setItem('quests', JSON.stringify({
        [ActivityType.BREATHING]: false,
        [ActivityType.GRATITUDE]: false,
        [ActivityType.AFFIRMATION]: false,
        [ActivityType.GAME]: false
      }));
      
      // Save updated streak
      await AsyncStorage.setItem('streak', JSON.stringify(streak));
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Breathing Exercise...</Text>
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
            <Text style={styles.title}>Breathing Exercise</Text>
            <Text style={styles.subtitle}>Completed: {completedExercises}/3</Text>
          </View>
          
          {/* Go Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          {/* Pattern Selector */}
          <View style={styles.patternSelector}>
            {BREATHING_PATTERNS.map((pattern, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.patternButton,
                  selectedPattern === idx && { backgroundColor: COLORS.accent3 }
                ]}
                onPress={() => setSelectedPattern(idx)}
              >
                <Text style={styles.patternText}>{pattern.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Breathing Circle */}
          <View style={styles.breathingContainer}>
            <Animated.View
              style={[
                styles.breathCircle,
                {
                  borderColor: COLORS.accent3,
                  transform: [
                    {
                      scale: breathAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5]
                      })
                    }
                  ]
                }
              ]}
            >
              <Text style={styles.breathPhaseText}>{breathPhase}</Text>
            </Animated.View>
            
            <Text style={styles.breathCountText}>
              Breaths completed: {breathCount}/3
            </Text>
          </View>
          
          {/* Complete Button */}
          {exerciseComplete && (
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: COLORS.accent3 }]}
              onPress={completeExercise}
            >
              <Text style={styles.buttonText}>
                Complete Exercise {completedExercises + 1}/3
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Text style={styles.progressLabel}>Quest Progress</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(completedExercises / 3) * 100}%`, 
                    backgroundColor: COLORS.accent3 
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
    alignItems: 'center',
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
    color: '#FFFFFF',
    fontSize: 16,
  },
  patternSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  patternButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    marginBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  patternText: {
    fontFamily: 'EasyCalm',
    fontSize: 14,
    color: COLORS.text,
  },
  breathingContainer: {
    alignItems: 'center',
    marginVertical: 30,
    height: 250, // Increased from 220 to add more space
  },
  
  breathCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60, // Increased from 20 to add more space below the circle
  },
  breathPhaseText: {
    fontFamily: 'EasyCalm',
    fontSize: 22,
    color: COLORS.text,
  },
  breathCountText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
  },
  completeButton: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'EasyCalm',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '90%',
    marginTop: 40,
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

export default BreathingQuest;