import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');


// Color palette matching the provided code
const COLORS = {
  primary: '#edb240', // Golden/amber color
  background: '#f5f2f0', // Light beige
  text: '#4a4a4a', // Dark gray
  accent1: '#a2d2ff', // Light blue
  accent2: '#ff8fab', // Pink
  accent3: '#9bf6ff', // Light cyan
  overlay: 'rgba(245, 242, 240, 0.7)', // Transparent beige
};

// Activity types
enum ActivityType {
  BREATHING = 'breathing',
  GRATITUDE = 'gratitude',
  AFFIRMATION = 'affirmation',
}

// Interface for activities
interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  color: string;
  completed: boolean;
}

// Affirmations list
const AFFIRMATIONS = [
  "I am worthy of peace and happiness",
  "I trust my journey and embrace new possibilities",
  "I celebrate my progress, no matter how small",
  "Today I choose joy over worry",
  "I nurture my mind as I nurture my garden",
];

// Breathing patterns
const BREATHING_PATTERNS = [
  { name: "Four-Seven-Eight Technique", inhale: 4, hold: 7, exhale: 8 },
  { name: "Box Breathing", inhale: 4, hold: 4, exhale: 4 },
];

// Gratitude prompts
const GRATITUDE_PROMPTS = [
  "What made you smile today?",
  "Who has helped you recently?",
  "What simple pleasure are you grateful for?",
];

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

const MindfulMomentsGame: React.FC = () => {
    const router = useRouter();
  // Load custom font
  const [fontsLoaded] = useFonts({
    EasyCalm: require('../assets/fonts/EasyCalm.ttf'),
  });

  // State variables
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [moodFeedback, setMoodFeedback] = useState<string>('');
  const [breathCount, setBreathCount] = useState<number>(0);
  const [breathPhase, setBreathPhase] = useState<string>("inhale");
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [gratitudeItems, setGratitudeItems] = useState<string[]>([]);
  const [currentAffirmation, setCurrentAffirmation] = useState<string>(AFFIRMATIONS[0]);
  const [selectedQuote, setSelectedQuote] = useState(QUOTES[0]);
  
  // Animation values
  const breathAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize activities and select a random quote
  useEffect(() => {
    const initialActivities: Activity[] = [
      {
        id: '1',

        type: ActivityType.BREATHING,
        title: 'Calm Breathing',
        description: 'Practice deep breathing to reduce stress and anxiety.',
        color: COLORS.accent3,
        completed: false,
      },
      {
        id: '2',
        type: ActivityType.GRATITUDE,
        title: 'Gratitude Practice',
        description: 'Note three things youre grateful for today.',
        color: COLORS.primary,
        completed: false,
      },
      {
        id: '3',
        type: ActivityType.AFFIRMATION,
        title: 'Daily Affirmation',
        description: 'Strengthen your mindset with positive self-talk.',
        color: COLORS.accent2,
        completed: false,
      },
    ];

    setActivities(initialActivities);
    
    // Select a random quote
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setSelectedQuote(QUOTES[randomIndex]);
  }, []);

  // Entry animations
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animation for breathing exercise
  useEffect(() => {
    if (currentActivity?.type === ActivityType.BREATHING && showModal) {
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
    }
  }, [breathPhase, showModal, currentActivity, selectedPattern]);

  // Start an activity
  const startActivity = (activity: Activity) => {
    setCurrentActivity(activity);
    
    // Reset activity-specific states
    if (activity.type === ActivityType.BREATHING) {
      setBreathCount(0);
      setBreathPhase("inhale");
      breathAnim.setValue(0);
    } 
    else if (activity.type === ActivityType.GRATITUDE) {
      setGratitudeItems([]);
    }
    
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Complete current activity
  const completeActivity = () => {
    if (!currentActivity) return;
    
    // Update activity as completed
    setActivities(current => 
      current.map(act => 
        act.id === currentActivity.id 
          ? { ...act, completed: true } 
          : act
      )
    );
    
    // Close modal
    setShowModal(false);
    setCurrentActivity(null);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Add gratitude item
  const addGratitudeItem = (item: string) => {
    // In a real app, would use TextInput for user entry
    // Using preset values for demo
    const presetItems = [
      "The beautiful sunset I saw today",
      "My supportive friend who called me",
      "The delicious meal I enjoyed"
    ];
    
    const newItem = item || presetItems[gratitudeItems.length];
    setGratitudeItems([...gratitudeItems, newItem]);
  };

  // Render activity content based on type
  const renderActivityContent = () => {
    if (!currentActivity) return null;

    switch (currentActivity.type) {
      case ActivityType.BREATHING:
        return (
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Breathing Exercise</Text>
            <Text style={styles.activityDescription}>
              Follow the circle as it expands and contracts
            </Text>
            
            <View style={styles.patternSelector}>
              {BREATHING_PATTERNS.map((pattern, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.patternButton,
                    selectedPattern === idx && { backgroundColor: currentActivity.color }
                  ]}
                  onPress={() => setSelectedPattern(idx)}
                >
                  <Text style={styles.patternText}>{pattern.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.breathingContainer}>
              <Animated.View
                style={[
                  styles.breathCircle,
                  {
                    borderColor: currentActivity.color,
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
                Breaths completed: {breathCount}
              </Text>
            </View>
            
            {breathCount >= 3 && (
              <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: currentActivity.color }]}
                onPress={completeActivity}
              >
                <Text style={styles.buttonText}>Complete Exercise</Text>
              </TouchableOpacity>
            )}
          </View>
        );
        
      case ActivityType.GRATITUDE:
        return (
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Gratitude Practice</Text>
            <Text style={styles.activityDescription}>
              {GRATITUDE_PROMPTS[Math.min(gratitudeItems.length, GRATITUDE_PROMPTS.length - 1)]}
            </Text>
            
            <View style={styles.gratitudeContainer}>
              {gratitudeItems.map((item, idx) => (
                <View key={idx} style={styles.gratitudeItem}>
                  <Text style={styles.gratitudeText}>• {item}</Text>
                </View>
              ))}
              
              {gratitudeItems.length < 3 && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: currentActivity.color }]}
                  onPress={() => addGratitudeItem('')}
                >
                  <Text style={styles.buttonText}>Add Gratitude</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {gratitudeItems.length >= 3 && (
              <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: currentActivity.color }]}
                onPress={completeActivity}
              >
                <Text style={styles.buttonText}>Complete Practice</Text>
              </TouchableOpacity>
            )}
          </View>
        );
        
      case ActivityType.AFFIRMATION:
        return (
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Daily Affirmation</Text>
            <Text style={styles.activityDescription}>
              Repeat this affirmation aloud or silently to yourself
            </Text>
            
            <View style={styles.affirmationContainer}>
              <Text style={[styles.affirmationText, { color: currentActivity.color }]}>
                "{currentAffirmation}"
              </Text>
              
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => {
                  const randomIndex = Math.floor(Math.random() * AFFIRMATIONS.length);
                  setCurrentAffirmation(AFFIRMATIONS[randomIndex]);
                }}
              >
                <Text style={styles.smallButtonText}>Try Another</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: currentActivity.color }]}
              onPress={completeActivity}
            >
              <Text style={styles.buttonText}>I've Practiced This Affirmation</Text>
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };

  // Mood selector component
  const MoodSelector = () => {
    return (
      <View style={styles.moodSelector}>
        <Text style={styles.moodQuestion}>How are you feeling today?</Text>
        <View style={styles.moodOptions}>
          {[1, 2, 3, 4, 5].map(value => (
            <TouchableOpacity
              key={value}
              style={[
                styles.moodOption,
                mood === value && { borderColor: COLORS.primary, borderWidth: 2 }
              ]}
              onPress={() => handleMoodSelection(value)}
            >
              <Text style={styles.moodEmoji}>
                {value === 1 ? '😢' : 
                 value === 2 ? '😕' : 
                 value === 3 ? '😐' : 
                 value === 4 ? '🙂' : '😄'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
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
        source={require('../assets/images/Bg.jpg')} // Change path to your image
        style={styles.background}
        resizeMode="cover"
    >
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Mindful Moments</Text>
          </View>
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Mood selector */}
            <MoodSelector />
            
            {/* Activities list */}
            <View style={styles.activitiesContainer}>
              <Text style={styles.sectionTitle}>Today's Practices</Text>
              
              {activities.map(activity => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityCard,
                    { borderColor: activity.color },
                    activity.completed && styles.completedActivity
                  ]}
                  onPress={() => !activity.completed && startActivity(activity)}
                >
                  <View style={styles.activityCardContent}>
                    <Text style={styles.activityCardTitle}>{activity.title}</Text>
                    <Text style={styles.activityCardDescription}>
                      {activity.description}
                    </Text>
                  </View>
                  
                  <View 
                    style={[
                      styles.activityStatus, 
                      { backgroundColor: activity.completed ? activity.color : 'transparent' }
                    ]}
                  >
                    {activity.completed && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Game Button */}
            <TouchableOpacity
            style={styles.gameButton}
            onPress={() => router.push('/memory')}
            >
            <Text style={styles.gameIcon}>🎮</Text>
            </TouchableOpacity>

            
            {/* Quote of the day */}
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteText}>
                "{selectedQuote.text}"
              </Text>
              <Text style={styles.quoteAuthor}>— {selectedQuote.author}</Text>
            </View>
          </ScrollView>
          
          {/* Activity Modal */}
          <Modal
            visible={showModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
              <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
                
                {renderActivityContent()}
              </View>
            </View>
          </Modal>
        </Animated.View>
    </ImageBackground>
  );
};


const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%"
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  title: {
    fontFamily: 'EasyCalm',
    fontSize: 45
    ,
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
  moodOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodFeedback: {
    fontFamily: 'EasyCalm',
    fontSize: 22,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    padding: 5,
    lineHeight: 22,
  },
  activitiesContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 15,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#edb240',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedActivity: {
    opacity: 0.7,
  },
  activityCardContent: {
    flex: 1,
    padding: 15,
  },
  activityCardTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 5,
  },
  activityCardDescription: {
    fontFamily: 'EasyCalm',
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
  },
  activityStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginRight: 15,
  },
  checkmark: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quoteContainer: {
    padding: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 15,
  },
  quoteText: {
    fontFamily: 'EasyCalm',
    fontSize: 24
    ,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  quoteAuthor: {
    fontFamily: 'EasyCalm',
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'right',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 32,
    color: COLORS.text,
  },
  activityContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  activityTitle: {
    fontFamily: 'EasyCalm',
    fontSize: 26,
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  activityDescription: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  patternSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  patternButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  patternText: {
    fontFamily: 'EasyCalm',
    fontSize: 14,
    color: COLORS.text,
  },
  breathingContainer: {
    alignItems: 'center',
    marginVertical: 20,
    height: 200, // Fixed height to prevent layout shifts
  },
  breathCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  gratitudeContainer: {
    width: '100%',
    marginVertical: 20,
  },
  gratitudeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  gratitudeText: {
    fontFamily: 'EasyCalm',
    fontSize: 16,
    color: COLORS.text,
  },
  affirmationContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  affirmationText: {
    fontFamily: 'EasyCalm',
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 10,
  },
  changeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  completeButton: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'EasyCalm',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  smallButtonText: {
    fontFamily: 'EasyCalm',
    fontSize: 14,
    color: COLORS.text,
  },

  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonTextt: {
    fontFamily: 'EasyCalm',
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  gameButton: {
    backgroundColor: COLORS.background, // Beige button background
    width: 70,
    height: 70,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 20,
    shadowColor: COLORS.primary, // Yellow shadow
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5, // Android shadow
  },
  
  gameIcon: {
    fontSize: 36,
    color: COLORS.primary, // Yellow icon on beige background
  },
  
});

export default MindfulMomentsGame;