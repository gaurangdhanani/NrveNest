import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export default function HomePage() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../assets/images/Homepage.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth')}>
          <Text style={styles.buttonText}>Enter Your Nest</Text>
        </TouchableOpacity>
      </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.3, // pushes button lower below the logo in image
  },
  button: {
    backgroundColor: '#EDB240',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'EasyCalm',
  },  
});
