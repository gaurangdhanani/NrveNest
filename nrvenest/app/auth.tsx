import {
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const { height } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    router.push('/game');
  };

  return (
    <ImageBackground
      source={require('../assets/images/Bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.overlay} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>You're One Step Closer</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.link}>
            Don’t have an account
            <Text style={{ fontFamily: 'SpaceMono', fontStyle: 'italic' }}>?</Text>{' '}
            <Text style={styles.linkBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
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
    color: '#f5f2f0',
    fontSize: 18,
    fontFamily: 'EasyCalm',
  },
  link: {
    color: '#555',
    fontSize: 14,
    fontFamily: 'EasyCalm',
    textAlign: 'center',
  },
  linkBold: {
    fontWeight: 'bold',
    color: '#EDB240',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
});
