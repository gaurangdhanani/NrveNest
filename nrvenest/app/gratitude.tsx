// src/app/gratitude.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, ImageBackground, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityType } from './types';

import { useFocusEffect } from '@react-navigation/native';


const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#edb240',
  background: '#f5f2f0',
  text: '#4a4a4a',
};

const GRATITUDE_PROMPTS = [
  "What made you smile today?",
  "Who has helped you recently?",
  "What simple pleasure are you grateful for?",
];

const GratitudeQuest: React.FC = () => {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    EasyCalm: require('../assets/fonts/EasyCalm.ttf'),
  });

  const [gratitudeItems, setGratitudeItems] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedItems = await AsyncStorage.getItem('gratitudeItems');
        if (savedItems) {
          const items = JSON.parse(savedItems);
          setGratitudeItems(items);
          setIsComplete(items.length >= 3);
          
          // If we already have some items, update the prompt index
          if (items.length > 0 && items.length < 3) {
            setCurrentPromptIndex(items.length);
          }
        }
      } catch (error) {
        console.error('Failed to load gratitude items:', error);
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

  const addGratitudeItem = async () => {
    if (currentInput.trim() === '') return;
    
    const newItems = [...gratitudeItems, currentInput.trim()];
    setGratitudeItems(newItems);
    setCurrentInput('');
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
    
    try {
      // Save gratitude items
      await AsyncStorage.setItem('gratitudeItems', JSON.stringify(newItems));
      
      // Update quest progress for main screen
      const questsData = await AsyncStorage.getItem('quests');
      let quests = questsData ? JSON.parse(questsData) : {};
      
      // Update the quest progress
      quests.gratitudeSteps = newItems.length;
      
      // If all 3 items are completed, mark the quest as complete
      if (newItems.length >= 3) {
        quests[ActivityType.GRATITUDE] = true;
        setIsComplete(true);
        await markQuestCompleted();
      } else {
        // Move to next prompt
        setCurrentPromptIndex(Math.min(newItems.length, GRATITUDE_PROMPTS.length - 1));
      }
      
      // Save updated quests
      await AsyncStorage.setItem('quests', JSON.stringify(quests));
    } catch (error) {
      console.error('Failed to save gratitude items:', error);
    }
  };

  const markQuestCompleted = async () => {
    try {
      // Get current quests
      const questsData = await AsyncStorage.getItem('quests');
      let quests = questsData ? JSON.parse(questsData) : {};
      
      // Mark gratitude quest as complete
      quests[ActivityType.GRATITUDE] = true;
      
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

  const finishQuest = () => {
    // Reset for next time
    setGratitudeItems([]);
    AsyncStorage.removeItem('gratitudeItems');
    
    // Go back to main screen
    router.back();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Gratitude Practice...</Text>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Gratitude Practice</Text>
              <Text style={styles.subtitle}>Items: {gratitudeItems.length}/3</Text>
            </View>
            
            {/* Go Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
            >
              {/* Current Prompt */}
              {!isComplete && (
                <Text style={styles.promptText}>
                  {GRATITUDE_PROMPTS[currentPromptIndex]}
                </Text>
              )}
              
              {/* Gratitude Items */}
              {gratitudeItems.map((item, index) => (
                <View key={index} style={styles.gratitudeItem}>
                  <Text style={styles.itemNumber}>{index + 1}.</Text>
                  <Text style={styles.gratitudeText}>{item}</Text>
                </View>
              ))}
              
              {/* Input Area */}
              {!isComplete && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={currentInput}
                    onChangeText={setCurrentInput}
                    placeholder="Enter something you're grateful for..."
                    placeholderTextColor="rgba(74, 74, 74, 0.5)"
                    multiline
                    returnKeyType="done"
                    onSubmitEditing={addGratitudeItem}
                  />
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: COLORS.primary }]}
                    onPress={addGratitudeItem}
                  >
                    <Text style={styles.buttonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Complete Message */}
              {isComplete && (
                <View style={styles.completeContainer}>
                  <Text style={styles.completeText}>
                    Wonderful! You've completed your gratitude practice for today.
                  </Text>
                  <TouchableOpacity
                    style={[styles.completeButton, { backgroundColor: COLORS.primary }]}
                    onPress={finishQuest}
                  >
                    <Text style={styles.buttonText}>Finish Quest</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <Text style={styles.progressLabel}>Quest Progress</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(gratitudeItems.length / 3) * 100}%`, 
                      backgroundColor: COLORS.primary 
                    }
                  ]} 
                />
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
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
    color: '#FFFFFF',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  promptText: {
    fontFamily: 'EasyCalm',
    fontSize: 20,
    color: COLORS.text,
    textAlign: 'center',
    marginVertical: 20,
  },
  gratitudeItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  itemNumber: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: 10,
  },
  gratitudeText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  inputContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(237, 178, 64, 0.5)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    color: COLORS.text,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'EasyCalm',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  completeText: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  completeButton: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
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

export default GratitudeQuest;