# Test Modes Specifications

## 1. Challenge Modes

### Mode A: Time Attack
- **Objective:** Complete as many correct signs as possible within a fixed time window.
- **Duration Options:** 60 seconds (standard), 120 seconds (extended).
- **Behavior:**
  - Timer counts down to zero.
  - Correct signs award +1 point and immediately switch to a new random word.
  - Skip awards 0 points and switches to a new random word.

### Mode B: Fixed Sprint
- **Objective:** Complete a fixed quota of target signs in the shortest time possible.
- **Quota Options:** 10 words (Quick Sprint), 20 words (Full Sprint).
- **Behavior:**
  - Timer counts up or tracks elapsed duration.
  - Concludes when the user completes all items in the quota.

---

## 2. Flashcard 3D Card-Flip Mechanics

Implemented in `PracticeWordFlashcardScreen.tsx` using `react-native-reanimated`:

```typescript
const flipAnim = useSharedValue(0);

const handleFlip = () => {
  setFlipped(!flipped);
  flipAnim.value = withSpring(flipped ? 0 : 180, { damping: 12, stiffness: 90 });
};

const frontAnimatedStyle = useAnimatedStyle(() => {
  const spinVal = interpolate(flipAnim.value, [0, 180], [0, 180]);
  return { transform: [{ rotateY: `${spinVal}deg` }] };
});

const backAnimatedStyle = useAnimatedStyle(() => {
  const spinVal = interpolate(flipAnim.value, [0, 180], [180, 360]);
  return { transform: [{ rotateY: `${spinVal}deg` }] };
});
```

- When `flipped === false`: Front displays the sign name, pack progress chip, and camera preview.
- When `flipped === true`: Back reveals the reference gesture illustration (`word_images/{word}.png`).
