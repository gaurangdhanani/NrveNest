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

export default function SignupScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!acceptedTerms) {
      setError('You must accept the terms and conditions to proceed.');
      return;
    }

    setError('');
    router.push('/quiz'); // redirect after successful signup
  };

  return (
    <ImageBackground
      source={require('../assets/images/Bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.overlay} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Your Nest</Text>

        <TextInput
          placeholder="First Name"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          placeholder="Last Name"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          keyboardType="email-address"
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

        {/* Terms and Conditions */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            style={[
              styles.checkbox,
              { backgroundColor: acceptedTerms ? '#EDB240' : 'transparent' },
            ]}
          />
          <Text style={styles.checkboxText}>
            The information we collect moving forward will be shared with your chosen profession
            and/or your institution to make your emotional experience better.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth')}>
          <Text style={styles.link}>
            Already have an account
            <Text style={{ fontFamily: 'SpaceMono', fontStyle: 'italic' }}>?</Text>{' '}
            <Text style={styles.linkBold}>Login</Text>
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#EDB240',
    borderRadius: 4,
    marginTop: 3,
  },
  checkboxText: {
    flex: 1,
    color: '#555',
    fontFamily: 'SpaceMono',
    fontSize: 12,
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
