// src/app/meditation.tsx

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
  accent2: '#ff8fab',
  white: '#FFFFFF',
};

// Meditation durations in minutes
const MEDITATION_DURATIONS = [
  { label: '3 min', value: 3 * 60 },
  { label: '5 min', value: 5 * 60 },
  { label: '10 min', value: 10 * 60 },
];

// Meditation tips
const MEDITATION_TIPS = [
  "Focus on your breath, inhaling and exhaling slowly",
  "When your mind wanders, gently bring it back to your breath",
  "Observe your thoughts without judgment",
  "Scan your body for tension and consciously relax",
  "Feel the weight of your body against the surface you're sitting on",
];

const MeditationTimer: React.FC = () => {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    EasyCalm: require('../assets/fonts/EasyCalm.ttf'),
  });

  const [selectedDuration, setSelectedDuration] = useState<number>(MEDITATION_DURATIONS[0].value);
  const [timeRemaining, setTimeRemaining] = useState<number>(selectedDuration);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [currentTip, setCurrentTip] = useState<string>(MEDITATION_TIPS[0]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = await AsyncStorage.getItem('meditationProgress');
        if (savedProgress) {
          setCompletedSessions(JSON.parse(savedProgress));
        }
        
        // Select random tip
        const randomTip = MEDITATION_TIPS[Math.floor(Math.random() * MEDITATION_TIPS.length)];
        setCurrentTip(randomTip);
      } catch (error) {
        console.error('Failed to load meditation progress:', error);
      }
    };
    
    loadProgress();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer functionality
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isPaused]);

  // Update progress animation
  useEffect(() => {
    if (isActive && !isPaused) {
      const progress = 1 - timeRemaining / selectedDuration;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [timeRemaining, isActive, isPaused]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Start meditation timer
  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  // Pause meditation timer
  const pauseTimer = () => {
    setIsPaused(true);
  };

  // Resume meditation timer
  const resumeTimer = () => {
    setIsPaused(false);
  };

  // Reset meditation timer
  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(selectedDuration);
    progressAnim.setValue(0);
  };

  // Change duration
  const changeDuration = (duration: number) => {
    if (!isActive) {
      setSelectedDuration(duration);
      setTimeRemaining(duration);
    }
  };

  // Complete meditation session
  const completeSession = async () => {
    const newCompleted = completedSessions + 1;
    setCompletedSessions(newCompleted);
    
    try {
      await AsyncStorage.setItem('meditationProgress', JSON.stringify(newCompleted));
      
      // Update quest progress for main screen
      const questsData = await AsyncStorage.getItem('quests');
      let quests = questsData ? JSON.parse(questsData) : {};
      
      // Update the quest progress
      quests.meditationSteps = newCompleted;
      
      // If all 3 sessions are completed, mark the quest as complete
      if (newCompleted >= 3) {
        quests[ActivityType.MEDITATION] = true;
        await markQuestCompleted();
      }
      
      // Save updated quests
      await AsyncStorage.setItem('quests', JSON.stringify(quests));
    } catch (error) {
      console.error('Failed to save meditation progress:', error);
    }
    
    // Reset timer state
    resetTimer();
  };

  const markQuestCompleted = async () => {
    try {
      // Get current quests
      const questsData = await AsyncStorage.getItem('quests');
      let quests = questsData ? JSON.parse(questsData) : {};
      
      // Mark meditation quest as complete
      quests[ActivityType.MEDITATION] = true;
      
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

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Meditation Timer...</Text>
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
            <Text style={styles.title}>Meditation Timer</Text>
            <Text style={styles.subtitle}>Completed: {completedSessions}/3</Text>
          </View>
          
          {/* Go Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          {/* Meditation Tip */}
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>{currentTip}</Text>
          </View>
          
          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <View style={styles.progressCircle}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </View>
          
          {/* Duration Selector */}
          {!isActive && (
            <View style={styles.durationSelector}>
              {MEDITATION_DURATIONS.map((duration, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.durationButton,
                    selectedDuration === duration.value && { backgroundColor: COLORS.accent2 }
                  ]}
                  onPress={() => changeDuration(duration.value)}
                >
                  <Text style={styles.durationText}>{duration.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Timer Controls */}
          <View style={styles.controlsContainer}>
            {!isActive ? (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: COLORS.accent2 }]}
                onPress={startTimer}
              >
                <Text style={styles.buttonText}>Start Meditation</Text>
              </TouchableOpacity>
            ) : (
              <>
                {isPaused ? (
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: COLORS.accent2 }]}
                    onPress={resumeTimer}
                  >
                    <Text style={styles.buttonText}>Resume</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: COLORS.accent2 }]}
                    onPress={pauseTimer}
                  >
                    <Text style={styles.buttonText}>Pause</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: '#ccc' }]}
                  onPress={resetTimer}
                >
                  <Text style={styles.buttonText}>Reset</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Text style={styles.progressLabel}>Quest Progress</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${(completedSessions / 3) * 100}%`, 
                    backgroundColor: COLORS.accent2 
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
    color: COLORS.white,
    fontSize: 16,
  },
  tipContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 15,
    padding: 20,
    marginVertical: 20,
    width: '90%',
  },
  tipText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 139, 171, 0.3)',
  },
  timerText: {
    fontFamily: 'MonoLisa',
    fontSize: 40,
    color: COLORS.text,
  },
  durationSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  durationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 10,
    borderRadius: 20,
  },
  durationText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  buttonText: {
    fontFamily: 'EasyCalm',
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '90%',
    marginTop: 20,
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
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
});

export default MeditationTimer;