// src/app/index.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityType, Quest } from './types';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';



const { width, height } = Dimensions.get('window');

// Color palette
const COLORS = {
  primary: '#edb240', // Golden/amber color
  background: '#f5f2f0', // Light beige
  text: '#4a4a4a', // Dark gray
  accent1: '#a2d2ff', // Light blue
  accent2: '#ff8fab', // Pink
  accent3: '#9bf6ff', // Light cyan
  overlay: 'rgba(245, 242, 240, 0.7)', // Transparent beige
};

// Collection of inspirational quotes
const QUOTES = [
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "You are the sky. Everything else is just the weather.", author: "Pema Chödrön" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "The wound is the place where the light enters you.", author: "Rumi" },
  { text: "Quiet the mind, and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
  { text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
  { text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra" },
  { text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill" },
  { text: "Breathe in peace, breathe out tension.", author: "Anonymous" },
  { text: "Life is available only in the present moment.", author: "Thich Nhat Hanh" },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
  { text: "Mindfulness isn't difficult, we just need to remember to do it.", author: "Sharon Salzberg" }
];

const MindfulMomentsHome: React.FC = () => {
  const router = useRouter();
  
  // Load custom font
  const [fontsLoaded] = useFonts({
    EasyCalm: require('../assets/fonts/EasyCalm.ttf'),
  });

  // State variables
  const [quests, setQuests] = useState<Quest[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [moodFeedback, setMoodFeedback] = useState<string>('');
  const [selectedQuote, setSelectedQuote] = useState(QUOTES[0]);
  const [streak, setStreak] = useState<number>(0);
  
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize quests and select a random quote
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        const randomIndex = Math.floor(Math.random() * QUOTES.length);
        setSelectedQuote(QUOTES[randomIndex]);
  
        try {
          const questsData = await AsyncStorage.getItem('quests');
          const savedQuests = questsData ? JSON.parse(questsData) : null;
  
          const streakData = await AsyncStorage.getItem('streak');
          if (streakData) {
            const streakInfo = JSON.parse(streakData);
            setStreak(streakInfo.currentStreak || 0);
          }
  
          const breathingProgress = await AsyncStorage.getItem('breathingProgress');
          const gratitudeItems = await AsyncStorage.getItem('gratitudeItems');
          const gameProgress = await AsyncStorage.getItem('gameProgress');
          const meditationProgress = await AsyncStorage.getItem('meditationProgress');
          const thoughtBubblesProgress = await AsyncStorage.getItem('thoughtBubblesProgress');
  
          const questsArray: Quest[] = [
            {
              id: '1',
              type: ActivityType.BREATHING,
              title: 'Calm Breathing',
              description: 'Complete 3 breathing exercises',
              color: COLORS.accent3,
              totalSteps: 3,
              completedSteps: savedQuests?.breathingSteps || JSON.parse(breathingProgress || '0'),
              completed: savedQuests ? savedQuests[ActivityType.BREATHING] : false,
              icon: 'lungs'
            },
            {
              id: '2',
              type: ActivityType.GRATITUDE,
              title: 'Gratitude Practice',
              description: 'Note 3 things you\'re grateful for',
              color: COLORS.primary,
              totalSteps: 3,
              completedSteps: savedQuests?.gratitudeSteps || JSON.parse(gratitudeItems || '[]').length,
              completed: savedQuests ? savedQuests[ActivityType.GRATITUDE] : false,
              icon: 'hand-heart'
            },
            {
              id: '3',
              type: ActivityType.GAME,
              title: 'Memory Game',
              description: 'Complete 3 memory games',
              color: COLORS.accent1,
              totalSteps: 3,
              completedSteps: savedQuests?.gameSteps || JSON.parse(gameProgress || '0'),
              completed: savedQuests ? savedQuests[ActivityType.GAME] : false,
              icon: 'puzzle'
            },
            {
              id: '4',
              type: ActivityType.MEDITATION,
              title: 'Meditation Timer',
              description: 'Complete 3 meditation sessions',
              color: COLORS.accent2,
              totalSteps: 3,
              completedSteps: savedQuests?.meditationSteps || JSON.parse(meditationProgress || '0'),
              completed: savedQuests ? savedQuests[ActivityType.MEDITATION] : false,
              icon: 'meditation'
            },
            {
              id: '5',
              type: ActivityType.THOUGHT_BUBBLES,
              title: 'Thought Bubbles',
              description: 'Pop bubbles to reframe thoughts',
              color: COLORS.accent2,
              totalSteps: 3,
              completedSteps: savedQuests?.thoughtBubblesSteps || JSON.parse(thoughtBubblesProgress || '0'),
              completed: savedQuests ? savedQuests[ActivityType.THOUGHT_BUBBLES] : false,
              icon: 'comment-processing-outline'
            }
          ];
          
          ;
  
          setQuests(questsArray);
        } catch (error) {
          console.error('Failed to load data:', error);
        }
      };
  
      loadData();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
  
    }, [])
  );
  

  // Handle mood selection and provide feedback
  const handleMoodSelection = (value: number) => {
    setMood(value);
    
    // Provide feedback based on mood
    switch(value) {
      case 1:
        setMoodFeedback("I'm sorry you're feeling down. These activities might help uplift you.");
        break;
      case 2:
        setMoodFeedback("Things may be tough right now, but small steps can help you feel better.");
        break;
      case 3:
        setMoodFeedback("Finding balance is important. These practices can help center you.");
        break;
      case 4:
        setMoodFeedback("You're doing well! Keep nurturing your positive mindset.");
        break;
      case 5:
        setMoodFeedback("That's wonderful! Maintain this positive energy with mindful practices.");
        break;
      default:
        setMoodFeedback("");
    }
  };

  // Navigate to quest page
  const navigateToQuest = (questType: ActivityType) => {
    switch (questType) {
      case ActivityType.BREATHING:
        router.push('/breathing');
        break;
      case ActivityType.GRATITUDE:
        router.push('/gratitude');
        break;
      case ActivityType.GAME:
        router.push('/memory');
        break;
        case ActivityType.MEDITATION:
          router.push('/meditation');
          break;
        case ActivityType.THOUGHT_BUBBLES:
          router.push('/thoughtbubbles');
          break;
      default:
        break;
    }
  };

  // Mood selector component
  const MoodSelector = () => {
    const moodOptions = [
      { value: 1, icon: 'emoticon-cry-outline', label: 'Down' },
      { value: 2, icon: 'emoticon-sad-outline', label: 'Low' },
      { value: 3, icon: 'emoticon-neutral-outline', label: 'Okay' },
      { value: 4, icon: 'emoticon-happy-outline', label: 'Good' },
      { value: 5, icon: 'emoticon-excited-outline', label: 'Great' },
    ];
  
    return (
      <View style={styles.moodSelector}>
        <Text style={styles.moodQuestion}>How are you feeling today?</Text>
        <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={[styles.moodScroll, { justifyContent: 'center' }]}
>
  <View style={styles.moodRow}>
    {moodOptions.map((option) => {
      const isSelected = mood === option.value;

      return (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.moodOption,
            isSelected && { backgroundColor: COLORS.primary }
          ]}
          onPress={() => handleMoodSelection(option.value)}
        >
          <MaterialCommunityIcons
            name={option.icon}
            size={28}
            color={isSelected ? '#fff' : COLORS.text}
          />
          <Text
            style={[
              styles.moodOptionLabel,
              isSelected && { color: '#fff' }
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
</ScrollView>

  
        {moodFeedback !== '' && (
          <Text style={styles.moodFeedback}>{moodFeedback}</Text>
        )}
      </View>
    );
  };
  

  // Loading screen
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Mindful Moments...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/Bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Mindful Moments</Text>
            {streak > 0 && (
              <View style={styles.streakContainer}>
                <Text style={styles.streakText}>🔥 {streak} day streak</Text>
              </View>
            )}
          </View>
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Mood selector */}
            <MoodSelector />
            
            {/* Quests */}
            <View style={styles.questsContainer}>
              <Text style={styles.sectionTitle}>Today's Quests</Text>
              
              <View style={styles.questGrid}>
                {quests.map(quest => (
                  <TouchableOpacity
                    key={quest.id}
                    style={[
                      styles.questButton,
                      { borderColor: quest.color }
                    ]}
                    onPress={() => navigateToQuest(quest.type)}
                  >
                    <MaterialCommunityIcons
  name={quest.icon}
  size={36}
  color={COLORS.text}
/>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${(quest.completedSteps / quest.totalSteps) * 100}%`, 
                            backgroundColor: quest.color 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {quest.completedSteps}/{quest.totalSteps}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Quote of the day */}
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteText}>
                "{selectedQuote.text}"
              </Text>
              <Text style={styles.quoteAuthor}>— {selectedQuote.author}</Text>
            </View>
          </ScrollView>
          <View style={styles.resetButtonWrapper}>
  <TouchableOpacity
    onPress={async () => {
      const initialQuests = {
        [ActivityType.BREATHING]: false,
        [ActivityType.GRATITUDE]: false,
        [ActivityType.GAME]: false,
        [ActivityType.MEDITATION]: false,
        [ActivityType.THOUGHT_BUBBLES]: false,
        breathingSteps: 0,
        gratitudeSteps: 0,
        gameSteps: 0,
        meditationSteps: 0,
        thoughtBubblesSteps: 0,
      };

      await AsyncStorage.setItem('quests', JSON.stringify(initialQuests));
      await AsyncStorage.removeItem('gratitudeItems');
      await AsyncStorage.removeItem('breathingProgress');
      await AsyncStorage.removeItem('meditationProgress');
      await AsyncStorage.removeItem('thoughtBubblesProgress');
      await AsyncStorage.removeItem('gameProgress');

      const updatedQuests: Quest[] = [
        {
          id: '1',
          type: ActivityType.BREATHING,
          title: 'Calm Breathing',
          description: 'Complete 3 breathing exercises',
          color: COLORS.accent3,
          totalSteps: 3,
          completedSteps: 0,
          completed: false,
          icon: 'lungs' // ✅ valid MaterialCommunityIcons name
        },
        {
          id: '2',
          type: ActivityType.GRATITUDE,
          title: 'Gratitude Practice',
          description: 'Note 3 things you\'re grateful for',
          color: COLORS.primary,
          totalSteps: 3,
          completedSteps: 0,
          completed: false,
          icon: 'hand-heart' // ✅
        },
        {
          id: '3',
          type: ActivityType.GAME,
          title: 'Memory Game',
          description: 'Complete 3 memory games',
          color: COLORS.accent1,
          totalSteps: 3,
          completedSteps: 0,
          completed: false,
          icon: 'puzzle' // ✅
        },
        {
          id: '4',
          type: ActivityType.MEDITATION,
          title: 'Meditation Timer',
          description: 'Complete 3 meditation sessions',
          color: COLORS.accent2,
          totalSteps: 3,
          completedSteps: 0,
          completed: false,
          icon: 'meditation' // ✅
        },
        {
          id: '5',
          type: ActivityType.THOUGHT_BUBBLES,
          title: 'Thought Bubbles',
          description: 'Pop bubbles to reframe thoughts',
          color: COLORS.accent2,
          totalSteps: 3,
          completedSteps: 0,
          completed: false,
          icon: 'comment-processing-outline' // ✅
        },
      ];
      

      setQuests(updatedQuests);

      alert('Quests have been reset.');
    }}
    style={styles.resetButton}
  >
    <Text style={styles.resetButtonText}>Reset Quests</Text>
  </TouchableOpacity>
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
  safeArea: {
    flex: 1,
  },
  container: {
    width: '100%',
    height: '100%',
    padding: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'EasyCalm',
    fontSize: 36,
    color: COLORS.primary,
    marginRight: 10,
  },
  streakContainer: {
    backgroundColor: 'rgba(237, 178, 64, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.primary,
  },
  moodSelector: {
    marginVertical: 20,
  },
  moodQuestion: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  moodScroll: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  
  moodOption: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  
  moodOptionLabel: {
    fontSize: 14,
    fontFamily: 'EasyCalm',
    color: COLORS.text,
    marginTop: 6,
    textAlign: 'center',
  },
  
  moodEmoji: {
    fontSize: 24,
  },
  moodFeedback: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    padding: 5,
    lineHeight: 22,
  },
  questsContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 15,
  },
  questGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  questButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    width: width * 0.43,
    height: width * 0.43,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  questIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  questTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    width: '90%',
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'EasyCalm',
    fontSize: 12,
    color: COLORS.text,
  },
  quoteContainer: {
    padding: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 15,
  },
  quoteText: {
    fontFamily: 'EasyCalm',
    fontSize: 20,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  quoteAuthor: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
    marginTop: 10,
  },
  resetButtonWrapper: {
    marginTop: 12
    ,
    marginBottom: 5,
    alignItems: 'center',
  },
  
  resetButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  
  resetButtonText: {
    color: '#fff',
    fontFamily: 'EasyCalm',
    fontSize: 16,
  },
  
  
});

export default MindfulMomentsHome;