import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';


const { width } = Dimensions.get('window');
const cardSize = width * 0.2;
const cardMargin = 5;

// Updated colors to match the mindful moments app
const COLORS = {
  primary: '#edb240', // Golden/amber color
  background: '#f5f2f0', // Light beige
  text: '#4a4a4a', // Dark gray
  cardBack: '#edb240', // Card back color (same as primary)
  white: '#FFFFFF',
};

// Define card interface for TypeScript
interface Card {
  id: number;
  symbol: string;
  color: string;
  posIndex: number;
}

const MemoryGame: React.FC = () => {
  // Add router for navigation
  const router = useRouter();
  
  // Load the EasyCalm font
  const [fontsLoaded] = useFonts({
    EasyCalm: require('../assets/fonts/EasyCalm.ttf'),
  });
  
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  // Initialize game on component mount
  useEffect(() => {
    initializeGame();
  }, []);

  // Set up the game board
  const initializeGame = () => {
    // Reset state
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameComplete(false);
    
    // Define symbols with updated colors to match theme
    const symbols = [
      { id: 1, symbol: '★', color: '#edb240' },
      { id: 2, symbol: '♦', color: '#a2d2ff' },
      { id: 3, symbol: '♥', color: '#ff8fab' },
      { id: 4, symbol: '♣', color: '#9bf6ff' },
      { id: 5, symbol: '♠', color: '#4a4a4a' },
      { id: 6, symbol: '✿', color: '#edb240' },
      { id: 7, symbol: '♫', color: '#a2d2ff' },
      { id: 8, symbol: '☀', color: '#ff8fab' },
    ];
    
    // Create card pairs
    let newCards: Card[] = [];
    for (let i = 0; i < symbols.length; i++) {
      // Add each symbol twice to create pairs
      newCards.push({
        id: symbols[i].id,
        symbol: symbols[i].symbol,
        color: symbols[i].color,
        posIndex: i * 2
      });
      
      newCards.push({
        id: symbols[i].id,
        symbol: symbols[i].symbol,
        color: symbols[i].color,
        posIndex: i * 2 + 1
      });
    }
    
    // Shuffle cards
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    
    // Set posIndex based on shuffled position
    for (let i = 0; i < newCards.length; i++) {
      newCards[i].posIndex = i;
    }
    
    setCards(newCards);
  };


  // Add these memory-related quotes to your file, alongside your other constants
const MEMORY_QUOTES = [
    { text: "Memories are the key not to the past, but to the future.", author: "Corrie Ten Boom" },
    { text: "The palest ink is better than the best memory.", author: "Chinese Proverb" },
    { text: "Memory is the diary we all carry about with us.", author: "Oscar Wilde" },
    { text: "The true art of memory is the art of attention.", author: "Samuel Johnson" },
    { text: "What we remember from childhood we remember forever.", author: "Cynthia Ozick" }
  ];
  
  // Add this state variable inside your component
  const [selectedMemoryQuote, setSelectedMemoryQuote] = useState(MEMORY_QUOTES[0]);
  
  // Inside useEffect, add this line alongside your other initialization
  useEffect(() => {
    initializeGame();
    
    // Select a random memory quote
    const randomIndex = Math.floor(Math.random() * MEMORY_QUOTES.length);
    setSelectedMemoryQuote(MEMORY_QUOTES[randomIndex]);
  }, []);


  // Handle card flip
  const flipCard = (index: number) => {
    // Ignore if two cards are already flipped
    if (flipped.length === 2) return;
    
    // Ignore if this card is already flipped or matched
    if (flipped.includes(index) || matched.includes(index)) return;
    
    // Add card to flipped array
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    
    // Check for match if two cards are flipped
    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      
      // Get the two flipped cards
      const card1 = cards.find(c => c.posIndex === newFlipped[0]);
      const card2 = cards.find(c => c.posIndex === newFlipped[1]);
      
      // Check if they match
      if (card1 && card2 && card1.id === card2.id) {
        // Add to matched array
        setMatched([...matched, newFlipped[0], newFlipped[1]]);
        setFlipped([]);
        
        // Check if game is complete
        if (matched.length + 2 >= 16) {
          setGameComplete(true);
        }
      } else {
        // Flip back after delay
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  // Determine if a card is flipped
  const isCardFlipped = (index: number) => {
    return flipped.includes(index) || matched.includes(index);
  };

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Memory Game...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/Bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Memory Game</Text>
          <Text style={styles.moves}>Moves: {moves}</Text>
        </View>
        
        {/* Go Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.board}>
          {cards.map((card) => {
            // Calculate position in 4x4 grid
            const row = Math.floor(card.posIndex / 4);
            const col = card.posIndex % 4;
            
            return (
              <TouchableOpacity
                key={card.posIndex}
                style={[
                  styles.card,
                  {
                    left: col * (cardSize + cardMargin * 2) + cardMargin,
                    top: row * (cardSize + cardMargin * 2) + cardMargin,
                    backgroundColor: isCardFlipped(card.posIndex) ? COLORS.white : COLORS.cardBack
                  }
                ]}
                onPress={() => flipCard(card.posIndex)}
              >
                {isCardFlipped(card.posIndex) ? (
                  <Text style={[styles.symbol, { color: card.color }]}>
                    {card.symbol}
                  </Text>
                ) : (
                  <Text style={styles.backSymbol}>?</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Add quote section here, after the board */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "{selectedMemoryQuote.text}"
          </Text>
          <Text style={styles.quoteAuthor}>— {selectedMemoryQuote.author}</Text>
        </View>
        
        {gameComplete && (
          <View style={styles.overlay}>
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>
                Congratulations! You completed the game in {moves} moves.
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={initializeGame}
                >
                  <Text style={styles.buttonText}>Play Again</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.homeButton]}
                  onPress={() => router.back()}
                >
                  <Text style={styles.buttonText}>Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background,
    },
    header: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontFamily: 'EasyCalm',
      fontSize: 32,
      color: COLORS.primary,
      marginBottom: 10,
    },
    moves: {
      fontFamily: 'EasyCalm',
      fontSize: 20,
      color: COLORS.text,
    },
    backButton: {
      position: 'absolute',
      top: 20,
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
    board: {
      width: 4 * (cardSize + cardMargin * 2),
      height: 4 * (cardSize + cardMargin * 2),
      position: 'relative',
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 10,
      padding: 5,
    },
    card: {
      position: 'absolute',
      width: cardSize,
      height: cardSize,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    symbol: {
      fontFamily: 'EasyCalm',
      fontSize: cardSize * 0.6,
      fontWeight: 'bold',
    },
    backSymbol: {
      fontSize: cardSize * 0.6,
      fontWeight: 'bold',
      color: COLORS.white,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageBox: {
      backgroundColor: COLORS.white,
      padding: 20,
      borderRadius: 20,
      alignItems: 'center',
      width: '90%',
      maxWidth: 350,
    },
    messageText: {
      fontFamily: 'EasyCalm',
      fontSize: 20,
      textAlign: 'center',
      marginBottom: 20,
      color: COLORS.text,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
    },
    button: {
      backgroundColor: COLORS.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
      marginHorizontal: 5,
    },
    homeButton: {
      backgroundColor: '#a2d2ff', // Using accent color from the main app
    },
    buttonText: {
      fontFamily: 'EasyCalm',
      color: COLORS.white,
      fontSize: 16,
      fontWeight: '600',
    },
  
    quoteContainer: {
      padding: 20,
      marginTop: 30,
      alignItems: 'center',
      width: '90%',
      maxWidth: 350,
    },
    quoteText: {
      fontFamily: 'EasyCalm',
      fontSize: 18,
      color: COLORS.text,
      textAlign: 'center',
      lineHeight: 24,
    },
    quoteAuthor: {
      fontFamily: 'EasyCalm',
      fontSize: 14,
      color: COLORS.text,
      textAlign: 'right',
      marginTop: 10,
      alignSelf: 'flex-end',
    },
  });


export default MemoryGame;