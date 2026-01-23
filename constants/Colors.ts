const tintColorLight = '#fb923c'; // Orange accent
const tintColorDark = '#fb923c'; // Orange accent for dark theme

export default {
  light: {
    text: '#fff', // White text for dark theme
    background: '#0a0a0a', // Almost black background
    tint: tintColorLight,
    tabIconDefault: '#737373', // Neutral gray for inactive tabs
    tabIconSelected: tintColorLight, // Orange for active tab
  },
  dark: {
    text: '#fff',
    background: '#0a0a0a', // Almost black
    tint: tintColorDark,
    tabIconDefault: '#737373', // Neutral gray
    tabIconSelected: tintColorDark, // Orange
  },
};
