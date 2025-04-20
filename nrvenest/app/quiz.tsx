import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardTypeOptions } from 'react-native';
import { WebView } from 'react-native-webview';
import { db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const { height } = Dimensions.get('window');

export default function QuizScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    age: '',
    personality: '',
    hobbies: '',
    music: '',
    emotionalNeeds: '',
    moods: '',
    learningStyle: '',
  });

  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const webviewRef = useRef(null);
  const [htmlContent, setHtmlContent] = useState('');

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://4c33-129-110-241-55.ngrok-free.app/generate_emotional_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });      

      const data = await response.json();
      setAiResult(data.profile);

      const userId = 'demo-user'; // Replace with auth.currentUser?.uid
      await setDoc(doc(db, 'users', userId), {
        quiz: { ...form },
        aiSummary: data.profile,
        createdAt: new Date(),
      });
    } catch (err) {
      const error = err as Error;
      console.error('AI fetch error:', error.message);
      setAiResult('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const fields: {
    key: keyof typeof form;
    placeholder: string;
    keyboardType?: KeyboardTypeOptions;
  }[] = [
    { key: 'age', placeholder: 'Age', keyboardType: 'numeric' },
    { key: 'personality', placeholder: 'Personality (e.g., Confident, Curious)' },
    { key: 'hobbies', placeholder: 'Hobbies (comma-separated)' },
    { key: 'music', placeholder: 'Music Taste' },
    { key: 'emotionalNeeds', placeholder: 'Emotional Needs' },
    { key: 'moods', placeholder: 'Common Moods' },
    { key: 'learningStyle', placeholder: 'Learning Style' },
  ];

  return (
    <ImageBackground
      source={require('../assets/images/Bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={styles.overlay}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Tell Us About You</Text>

        {fields.map((field) => (
          <TextInput
            key={field.key}
            placeholder={field.placeholder}
            placeholderTextColor="#aaa"
            value={form[field.key]}
            onChangeText={(val) => handleChange(field.key, val)}
            keyboardType={field.keyboardType}
            style={styles.input}
          />
        ))}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Analyzing...' : 'Submit and Analyze'}</Text>
        </TouchableOpacity>

        {htmlContent.length > 0 && (
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            onMessage={async (event) => {
              const aiText = event.nativeEvent.data;
              setAiResult(aiText);
              setLoading(false);

              const userId = 'demo-user';
              await setDoc(doc(db, 'users', userId), {
                quiz: { ...form },
                aiSummary: aiText,
                createdAt: new Date(),
              });
            }}
            javaScriptEnabled
            style={{ height: 200, width: '100%', marginTop: 20 }}
          />
        )}

        {aiResult && (
          <View style={{ marginTop: 24, gap: 12, width: '100%' }}>
            <Text style={styles.title}>Your AI Summary</Text>
            <Text style={styles.summaryText}>{aiResult}</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/game')}
            >
              <Text style={styles.buttonText}>Continue to the Game</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.1,
    gap: 16,
  },
  title: {
    fontSize: 24,
    color: '#EDB240',
    fontFamily: 'EasyCalm',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'SpaceMono',
    color: '#333',
  },
  button: {
    backgroundColor: '#EDB240',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 24,
  },
  buttonText: {
    color: '#F5F2F0',
    fontSize: 18,
    fontFamily: 'EasyCalm',
    textAlign: 'center',
  },
  summaryText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: '#333333', // text color
    backgroundColor: '#F5F2F0', // box color
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDB240',
    lineHeight: 20,
    width: '100%',
  },
});
