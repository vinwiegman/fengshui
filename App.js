import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const palette = {
  paper: "#f7f3ec",
  panel: "#fffdf8",
  ink: "#1d2522",
  muted: "#69736e",
  line: "#ded7cb",
  green: "#2f7b63",
  greenDark: "#1f5d4b",
  coral: "#d95f4b",
  blue: "#456fb0",
  gold: "#bd8b2c",
  lilac: "#7a5aa6",
};

const steps = [
  { id: "photo", label: "Photo", icon: "image-outline" },
  { id: "inventory", label: "Items", icon: "cube-outline" },
  { id: "analysis", label: "Read", icon: "analytics-outline" },
  { id: "plan", label: "Plan", icon: "trail-sign-outline" },
  { id: "summary", label: "Export", icon: "share-outline" },
];

const goals = [
  "make the room feel larger",
  "improve study space",
  "reduce visible clutter",
  "improve walking space",
  "improve lighting",
  "create a calmer appearance",
];

const starterObjects = [
  { id: "bed_1", label: "Bed", type: "bed", movable: false, confidence: 0.91, zone: "left wall", box: { x: 8, y: 54, w: 46, h: 30 } },
  { id: "desk_1", label: "Desk", type: "desk", movable: true, confidence: 0.86, zone: "window side", box: { x: 56, y: 36, w: 32, h: 24 } },
  { id: "chair_1", label: "Chair", type: "chair", movable: true, confidence: 0.82, zone: "desk front", box: { x: 48, y: 55, w: 18, h: 21 } },
  { id: "wardrobe_1", label: "Wardrobe", type: "wardrobe", movable: false, confidence: 0.79, zone: "back wall", box: { x: 70, y: 12, w: 22, h: 35 } },
  { id: "clutter_1", label: "Floor clutter", type: "clutter", movable: true, confidence: 0.74, zone: "floor path", box: { x: 30, y: 73, w: 27, h: 13 } },
];

const constraintOptions = [
  "no purchases",
  "do not move bed",
  "do not block door",
  "retain wardrobe access",
  "keep desk usable",
];

const easeOut = Easing.bezier(0.23, 1, 0.32, 1);

const MotionContext = createContext(false);

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((value) => {
      if (mounted) setReduced(!!value);
    });
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (value) => setReduced(!!value));
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}

function useStepTransition(step) {
  const reduced = useContext(MotionContext);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const previousStep = useRef(step);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;

    if (reduced) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, easing: easeOut, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 240, easing: easeOut, useNativeDriver: true }),
    ]).start();
  }, [step, reduced]);

  return { opacity, transform: [{ translateY }] };
}

function Tappable({ onPress, style, children, scaleTo = 0.97, ...rest }) {
  const reduced = useContext(MotionContext);
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    if (reduced) return;
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }

  function pressOut() {
    if (reduced) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
  }

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={style} {...rest}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

function FadeInItem({ index = 0, style, children }) {
  const reduced = useContext(MotionContext);
  const opacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduced ? 0 : 10)).current;

  useEffect(() => {
    if (reduced) return;
    const delay = Math.min(index, 6) * 45;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, delay, easing: easeOut, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, delay, easing: easeOut, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function AnimatedBar({ value, color }) {
  const reduced = useContext(MotionContext);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.max(0, Math.min(100, value)) / 100,
      duration: reduced ? 0 : 550,
      easing: easeOut,
      useNativeDriver: true,
    }).start();
  }, [value, reduced]);

  return (
    <Animated.View
      style={[
        styles.scoreFill,
        {
          backgroundColor: color,
          transform: [{ scaleX: progress }],
          transformOrigin: "left",
        },
      ]}
    />
  );
}

function FieldInput({ style, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...rest}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.input, focused && styles.inputFocused, style]}
    />
  );
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState("photo");
  const [photo, setPhoto] = useState(null);
  const [objects, setObjects] = useState(starterObjects);
  const [goal, setGoal] = useState(goals[0]);
  const [constraints, setConstraints] = useState(["no purchases", "do not block door", "retain wardrobe access"]);
  const [analysisState, setAnalysisState] = useState("idle");

  const analysis = useMemo(() => buildAnalysis(objects, constraints, photo), [objects, constraints, photo]);
  const plan = useMemo(() => generatePlan(objects, goal), [objects, goal]);
  const stepAnim = useStepTransition(step);
  const currentStep = steps.find((item) => item.id === step) || steps[0];
  const currentStepIndex = Math.max(0, steps.findIndex((item) => item.id === step));

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.88,
    });

    if (!result.canceled) {
      const selectedPhoto = result.assets[0];
      setPhoto(selectedPhoto);
      setAnalysisState("scanning");
      setObjects(createSimulatedDetections(selectedPhoto));
      setTimeout(() => setAnalysisState("complete"), 1400);
    }
  }

  function updateObject(id, patch) {
    setObjects((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addObject() {
    const next = objects.length + 1;
    setObjects((current) => [
      ...current,
      {
        id: `item_${next}`,
        label: `Item ${next}`,
        type: "clutter",
        movable: true,
        confidence: 0.58,
        zone: "user added",
        box: { x: 18 + (next % 4) * 12, y: 24 + (next % 3) * 16, w: 22, h: 14 },
      },
    ]);
  }

  function toggleConstraint(value) {
    setConstraints((current) =>
      current.includes(value) ? current.filter((constraint) => constraint !== value) : [...current, value],
    );
  }

  return (
    <MotionContext.Provider value={reducedMotion}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Room redesign MVP</Text>
              <Text style={styles.title}>RoomRead</Text>
              <Text style={styles.headerSubtitle}>{currentStep.label} · Step {currentStepIndex + 1} of {steps.length}</Text>
            </View>
            <View style={styles.zeroBadge}>
              <Ionicons name="cash-outline" color={palette.greenDark} size={16} />
              <Text style={styles.zeroBadgeText}>Zero-budget</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: stepAnim.opacity, transform: stepAnim.transform }}>
              {step === "photo" && <PhotoScreen photo={photo} objects={objects} analysisState={analysisState} pickImage={pickImage} />}
              {step === "inventory" && (
                <InventoryScreen
                  objects={objects}
                  updateObject={updateObject}
                  addObject={addObject}
                  constraints={constraints}
                  toggleConstraint={toggleConstraint}
                />
              )}
              {step === "analysis" && <AnalysisScreen analysis={analysis} goal={goal} setGoal={setGoal} analysisState={analysisState} />}
              {step === "plan" && <PlanScreen photo={photo} objects={objects} plan={plan} analysis={analysis} />}
              {step === "summary" && <SummaryScreen photo={photo} objects={objects} goal={goal} constraints={constraints} analysis={analysis} plan={plan} />}
            </Animated.View>
          </ScrollView>

          <FlowDock value={step} onChange={setStep} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </MotionContext.Provider>
  );
}

function FlowDock({ value, onChange }) {
  const index = Math.max(0, steps.findIndex((item) => item.id === value));
  const current = steps[index] || steps[0];
  const previous = steps[index - 1];
  const next = steps[index + 1];

  return (
    <View style={styles.flowDock}>
      <Tappable
        accessibilityRole="button"
        disabled={!previous}
        onPress={() => previous && onChange(previous.id)}
        style={[styles.flowButton, !previous && styles.flowButtonDisabled]}
        scaleTo={0.95}
      >
        <Ionicons name="chevron-back" size={18} color={previous ? palette.ink : palette.muted} />
      </Tappable>

      <View style={styles.flowCenter}>
        <View style={styles.flowLabelRow}>
          <Ionicons name={current.icon} size={16} color={palette.greenDark} />
          <Text style={styles.flowLabel}>{current.label}</Text>
        </View>
        <View style={styles.progressDots}>
          {steps.map((item) => {
            const active = item.id === value;
            return (
              <Tappable
                accessibilityRole="button"
                key={item.id}
                onPress={() => onChange(item.id)}
                style={[styles.progressDot, active && styles.progressDotActive]}
                scaleTo={0.86}
              >
                <View />
              </Tappable>
            );
          })}
        </View>
      </View>

      <Tappable
        accessibilityRole="button"
        disabled={!next}
        onPress={() => next && onChange(next.id)}
        style={[styles.flowButton, styles.flowButtonPrimary, !next && styles.flowButtonDisabled]}
        scaleTo={0.95}
      >
        <Ionicons name="chevron-forward" size={18} color={next ? "#fff" : palette.muted} />
      </Tappable>
    </View>
  );
}

function StepTabs({ value, onChange }) {
  return (
    <View style={styles.tabs}>
      {steps.map((item) => {
        const active = item.id === value;
        return (
          <Tappable
            accessibilityRole="button"
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.tab, active && styles.tabActive]}
            scaleTo={0.95}
          >
            <Ionicons name={item.icon} size={17} color={active ? "#fff" : palette.muted} />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
          </Tappable>
        );
      })}
    </View>
  );
}

function PhotoScreen({ photo, objects, analysisState, pickImage }) {
  return (
    <View style={styles.stack}>
      <Tappable style={styles.photoPanel} onPress={pickImage} scaleTo={0.99}>
        {photo ? (
          <AnnotatedPhoto photo={photo} objects={objects} showArrows={false} />
        ) : (
          <View style={styles.photoEmpty}>
            <FadeInItem index={0}>
              <View style={styles.addCircle}>
                <Ionicons name="add" size={32} color="#fff" />
              </View>
            </FadeInItem>
            <Text style={styles.photoTitle}>Upload one bedroom photo</Text>
            <Text style={styles.bodyTextLight}>Use a clear wide shot with furniture, floor, and doorway visible.</Text>
          </View>
        )}
      </Tappable>

      {analysisState === "scanning" ? (
        <FadeInItem>
          <View style={styles.scanBanner}>
            <ActivityIndicator color={palette.greenDark} />
            <View style={styles.flex}>
              <Text style={styles.scanTitle}>AI analysis simulated</Text>
              <Text style={styles.bodyText}>Reading room coverage, furniture candidates, and visible clutter.</Text>
            </View>
          </View>
        </FadeInItem>
      ) : null}

      <Panel title="Capture checks">
        <View style={styles.metrics}>
          <Metric value={photo ? "ready" : "needed"} label="photo" />
          <Metric value={photo?.width > photo?.height ? "wide" : photo ? "portrait" : "--"} label="coverage" />
          <Metric value={photo ? `${Math.round(averageConfidence(objects) * 100)}%` : "--"} label="confidence" />
        </View>
        <Text style={styles.note}>
          Real object detection, masks, depth maps, and generated after-images need model weights or external APIs.
          This mobile MVP keeps detections editable until that pipeline is connected.
        </Text>
      </Panel>
    </View>
  );
}

function InventoryScreen({ objects, updateObject, addObject, constraints, toggleConstraint }) {
  return (
    <View style={styles.stack}>
      <Panel title="Editable inventory" actionLabel="Add item" onAction={addObject}>
        <View style={styles.inventoryList}>
          {objects.map((item, index) => (
            <FadeInItem key={item.id} index={index} style={styles.itemRow}>
              <View style={[styles.swatch, { backgroundColor: colorForType(item.type) }]} />
              <View style={styles.itemFields}>
                <View style={styles.confidenceLine}>
                  <Text style={styles.detectedLabel}>Detected object</Text>
                  <Text style={styles.confidenceText}>{Math.round((item.confidence || 0.5) * 100)}% confidence</Text>
                </View>
                <FieldInput
                  value={item.label}
                  onChangeText={(label) => updateObject(item.id, { label })}
                  placeholder="Object label"
                  placeholderTextColor={palette.muted}
                />
                <FieldInput
                  value={item.type}
                  onChangeText={(type) => updateObject(item.id, { type: type.toLowerCase() })}
                  placeholder="type"
                  placeholderTextColor={palette.muted}
                />
                <FieldInput
                  value={item.zone}
                  onChangeText={(zone) => updateObject(item.id, { zone })}
                  placeholder="zone"
                  placeholderTextColor={palette.muted}
                />
              </View>
              <Switch
                value={item.movable}
                onValueChange={(movable) => updateObject(item.id, { movable })}
                trackColor={{ true: palette.green, false: "#d8d2c8" }}
                thumbColor="#fff"
              />
            </FadeInItem>
          ))}
        </View>
      </Panel>

      <Panel title="Hard constraints">
        <View style={styles.chipWrap}>
          {constraintOptions.map((constraint) => {
            const active = constraints.includes(constraint);
            return (
              <Tappable
                key={constraint}
                onPress={() => toggleConstraint(constraint)}
                style={[styles.chip, active && styles.chipActive]}
                scaleTo={0.95}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{constraint}</Text>
              </Tappable>
            );
          })}
        </View>
      </Panel>
    </View>
  );
}

function AnalysisScreen({ analysis, goal, setGoal, analysisState }) {
  return (
    <View style={styles.stack}>
      {analysisState === "scanning" ? (
        <FadeInItem>
          <View style={styles.scanBanner}>
            <ActivityIndicator color={palette.greenDark} />
            <View style={styles.flex}>
              <Text style={styles.scanTitle}>AI analysis simulated</Text>
              <Text style={styles.bodyText}>Scoring layout and building editable findings from the uploaded photo.</Text>
            </View>
          </View>
        </FadeInItem>
      ) : null}

      <Panel eyebrow="Room profile" title={analysis.category}>
        <View style={styles.metrics}>
          <Metric value={analysis.calm} label="calm" />
          <Metric value={analysis.clutter} label="clutter" />
          <Metric value={analysis.flow} label="flow" />
        </View>
      </Panel>

      <Panel title="Findings">
        {analysis.findings.map((finding, index) => (
          <FadeInItem key={finding.title} index={index} style={styles.finding}>
            <Text style={styles.findingTitle}>{finding.title}</Text>
            <Text style={styles.bodyText}>{finding.body}</Text>
          </FadeInItem>
        ))}
      </Panel>

      <Panel title="Redesign goal">
        <View style={styles.goalGrid}>
          {goals.map((item) => {
            const active = item === goal;
            return (
              <Tappable key={item} onPress={() => setGoal(item)} style={[styles.goal, active && styles.goalActive]} scaleTo={0.96}>
                <Text style={[styles.goalText, active && styles.goalTextActive]}>{item}</Text>
              </Tappable>
            );
          })}
        </View>
      </Panel>
    </View>
  );
}

function PlanScreen({ photo, objects, plan, analysis }) {
  return (
    <View style={styles.stack}>
      <View style={styles.conceptPanel}>
        {photo ? <AnnotatedPhoto photo={photo} objects={objects} showArrows /> : <View style={styles.conceptFallback} />}
        <View style={styles.overlayCard}>
          <Text style={styles.overlayTitle}>Concept overlay</Text>
          <Text style={styles.overlayText}>Arrows and actions are planning guidance, not measured fit proof.</Text>
        </View>
      </View>

      <Panel title="Rearrangement plan">
        {plan.map((item, index) => (
          <FadeInItem key={item.step} index={index} style={styles.planItem}>
            <View style={styles.planIndex}>
              <Text style={styles.planIndexText}>{item.step}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.planTitle}>
                {item.action}: {item.object}
              </Text>
              <Text style={styles.bodyText}>
                To: {item.destination}. {item.reason}
              </Text>
            </View>
          </FadeInItem>
        ))}
      </Panel>

      <Panel title="Before / after score">
        <View style={styles.scoreLine}>
          <Text style={styles.scoreLabel}>Current</Text>
          <View style={styles.scoreTrack}>
            <AnimatedBar value={analysis.flow} color={palette.coral} />
          </View>
          <Text style={styles.scoreValue}>{analysis.flow}</Text>
        </View>
        <View style={styles.scoreLine}>
          <Text style={styles.scoreLabel}>After plan</Text>
          <View style={styles.scoreTrack}>
            <AnimatedBar value={Math.min(94, analysis.flow + 22)} color={palette.green} />
          </View>
          <Text style={styles.scoreValue}>{Math.min(94, analysis.flow + 22)}</Text>
        </View>
      </Panel>
    </View>
  );
}

function SummaryScreen({ photo, objects, goal, constraints, analysis, plan }) {
  const summary = [
    "RoomRead zero-budget redesign summary",
    `Photo: ${photo ? `${photo.width}x${photo.height}` : "not uploaded"}`,
    `Goal: ${goal}`,
    `Room: ${analysis.category}`,
    `Scores: calm ${analysis.calm}, clutter ${analysis.clutter}, flow ${analysis.flow}`,
    `Detected items: ${objects.map((item) => item.label).join(", ")}`,
    `Constraints: ${constraints.join(", ")}`,
    "Plan:",
    ...plan.map((item) => `${item.step}. ${item.action} ${item.object} -> ${item.destination}`),
  ].join("\n");

  async function shareSummary() {
    await Share.share({ message: summary, title: "RoomRead redesign summary" });
  }

  return (
    <View style={styles.stack}>
      <Panel eyebrow="Export" title="Demo summary">
        <View style={styles.summaryHero}>
          <Ionicons name="document-text-outline" size={30} color={palette.greenDark} />
          <View style={styles.flex}>
            <Text style={styles.findingTitle}>Ready to share</Text>
            <Text style={styles.bodyText}>A compact report of the uploaded photo, detected items, constraints, scores, and plan.</Text>
          </View>
        </View>
        <Tappable onPress={shareSummary} style={styles.primaryButton} scaleTo={0.97}>
          <Ionicons name="share-outline" color="#fff" size={18} />
          <Text style={styles.primaryText}>Share summary</Text>
        </Tappable>
      </Panel>

      <Panel title="Preview">
        <Text style={styles.summaryText}>{summary}</Text>
      </Panel>
    </View>
  );
}

function AnnotatedPhoto({ photo, objects, showArrows }) {
  const visibleObjects = objects.slice(0, 6);
  return (
    <View style={styles.annotatedWrap}>
      <Image source={{ uri: photo.uri }} style={styles.roomPhoto} />
      <View style={styles.photoShade} />
      {visibleObjects.map((item, index) => (
        <FadeInItem
          key={item.id}
          index={index}
          style={[
            styles.detectBox,
            {
              borderColor: colorForType(item.type),
              left: `${item.box?.x || 12}%`,
              top: `${item.box?.y || 20}%`,
              width: `${item.box?.w || 20}%`,
              height: `${item.box?.h || 14}%`,
            },
          ]}
        >
          <Text style={[styles.boxLabel, { backgroundColor: colorForType(item.type) }]} numberOfLines={1}>
            {item.label}
          </Text>
        </FadeInItem>
      ))}
      {showArrows ? (
        <FadeInItem index={visibleObjects.length + 1}>
          <View style={[styles.arrowLine, styles.arrowOne]} />
          <View style={[styles.arrowHead, styles.arrowHeadOne]} />
          <View style={[styles.arrowLine, styles.arrowTwo]} />
          <View style={[styles.arrowHead, styles.arrowHeadTwo]} />
        </FadeInItem>
      ) : null}
    </View>
  );
}

function Panel({ title, eyebrow, children, actionLabel, onAction }) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.flex}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.panelTitle}>{title}</Text>
        </View>
        {actionLabel ? (
          <Tappable onPress={onAction} style={styles.secondaryButton} scaleTo={0.95}>
            <Text style={styles.secondaryText}>{actionLabel}</Text>
          </Tappable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Metric({ value, label }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function buildAnalysis(objects, constraints, photo) {
  const clutterCount = objects.filter((item) => ["clutter", "clothing", "boxes"].includes(item.type)).length;
  const movableCount = objects.filter((item) => item.movable).length;
  const hasDesk = objects.some((item) => item.type === "desk");
  const hasChair = objects.some((item) => item.type === "chair");
  const widePhotoBonus = photo?.width > photo?.height ? 6 : 0;
  const portraitPenalty = photo && photo.width <= photo.height ? 5 : 0;
  const confidenceBonus = Math.round((averageConfidence(objects) - 0.7) * 20);
  const flow = Math.max(30, 78 - clutterCount * 14 + widePhotoBonus - portraitPenalty);
  const calm = Math.max(28, 74 - clutterCount * 11 + (constraints.includes("no purchases") ? 4 : 0) + confidenceBonus);
  const clutter = Math.min(95, 28 + clutterCount * 23);

  return {
    category: photo
      ? movableCount > 3
        ? "Scanned student room, flexible layout"
        : "Scanned bedroom, fixed-furniture layout"
      : movableCount > 3
        ? "Student room, flexible layout"
        : "Bedroom, fixed-furniture layout",
    flow,
    calm,
    clutter,
    findings: [
      {
        title: "Photo read",
        body: photo
          ? `${photo.width}x${photo.height} image. ${photo.width > photo.height ? "Wide coverage improves the simulated layout read." : "Portrait crop may hide wall-to-wall relationships."}`
          : "No room photo yet. Uploading a photo will change coverage, confidence, and findings.",
      },
      {
        title: "Likely style",
        body: `Practical modern bedroom with mixed storage. Simulated average detection confidence is ${Math.round(averageConfidence(objects) * 100)}%.`,
      },
      {
        title: "Clutter pressure",
        body:
          clutterCount > 0
            ? "Loose or uncertain items should be grouped, hidden, folded, or moved off the walking path first."
            : "No clutter items are marked. Add any loose objects you want the plan to handle.",
      },
      {
        title: "Workspace clearance",
        body:
          hasDesk && hasChair
            ? "The desk-chair pair should stay together and leave chair pull-back space."
            : "Add a desk and chair to unlock workspace-specific suggestions.",
      },
    ],
  };
}

function createSimulatedDetections(photo) {
  const isWide = photo?.width > photo?.height;
  const sizeScore = Math.min(0.08, ((photo?.width || 1200) * (photo?.height || 900)) / 12000000);
  const base = isWide ? 0.82 : 0.74;
  return starterObjects.map((item, index) => ({
    ...item,
    confidence: Math.min(0.96, base + sizeScore - index * 0.025),
    zone: isWide ? item.zone : item.zone.replace("wall", "visible wall").replace("side", "cropped side"),
    box: isWide
      ? item.box
      : {
          ...item.box,
          x: Math.min(78, (item.box?.x || 20) + 5),
          w: Math.max(16, (item.box?.w || 22) - 4),
        },
  }));
}

function averageConfidence(objects) {
  if (objects.length === 0) return 0;
  return objects.reduce((sum, item) => sum + (item.confidence || 0.5), 0) / objects.length;
}

function generatePlan(objects, goal) {
  const actions = [];
  const clutter = objects.filter((item) => ["clutter", "clothing", "boxes"].includes(item.type) && item.movable);
  const desk = objects.find((item) => item.type === "desk");
  const chair = objects.find((item) => item.type === "chair");
  const bed = objects.find((item) => item.type === "bed");
  const wardrobe = objects.find((item) => item.type === "wardrobe");

  clutter.slice(0, 2).forEach((item) => {
    actions.push({
      action: item.type === "clothing" ? "fold" : "group",
      object: item.label,
      destination: wardrobe ? "inside or beside the wardrobe" : "one storage zone against a wall",
      reason: "Reduces visible floor clutter while staying in zero-budget mode.",
    });
  });

  if (desk?.movable && goal.includes("study")) {
    actions.push({
      action: "move",
      object: desk.label,
      destination: "closer to the brightest wall or window side",
      reason: "Improves work focus and keeps the desk as the room's active zone.",
    });
  } else if (desk?.movable) {
    actions.push({
      action: "align",
      object: desk.label,
      destination: "flat against the nearest wall",
      reason: "Opens the center of the room without buying storage.",
    });
  }

  if (chair?.movable) {
    actions.push({
      action: "rotate",
      object: chair.label,
      destination: "tucked squarely under the desk when not in use",
      reason: "Improves walking space and reduces visual noise.",
    });
  }

  if (bed && !bed.movable) {
    actions.push({
      action: "clear surface",
      object: bed.label,
      destination: "keep bedding and loose items within the bed footprint",
      reason: "Treats the fixed bed as a calm anchor instead of moving it.",
    });
  }

  actions.push({
    action: "validate",
    object: "Door and wardrobe paths",
    destination: "leave a clear route after each move",
    reason: "Hard constraint check: no purchase, no blocked access, no unsupported new furniture.",
  });

  return actions.slice(0, 5).map((item, index) => ({ ...item, step: index + 1 }));
}

function colorForType(type) {
  if (type === "bed") return palette.coral;
  if (type === "desk") return palette.blue;
  if (type === "chair") return palette.green;
  if (type === "wardrobe") return palette.gold;
  if (type === "clutter") return palette.lilac;
  return "#3c7a86";
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  eyebrow: {
    color: palette.greenDark,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    color: palette.ink,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  zeroBadge: {
    alignItems: "center",
    backgroundColor: "#e9f1ec",
    borderColor: "#cdded3",
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  zeroBadgeText: {
    color: palette.greenDark,
    fontSize: 13,
    fontWeight: "800",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderColor: palette.line,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minHeight: 50,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tabText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#fff",
  },
  scroll: {
    padding: 18,
    paddingBottom: 120,
  },
  flowDock: {
    alignItems: "center",
    backgroundColor: "rgba(255,253,248,0.96)",
    borderColor: "rgba(222,216,205,0.9)",
    borderRadius: 24,
    borderWidth: 1,
    bottom: 14,
    flexDirection: "row",
    gap: 12,
    left: 16,
    padding: 10,
    position: "absolute",
    right: 16,
    shadowColor: "#261f17",
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  flowButton: {
    alignItems: "center",
    backgroundColor: "#f2eee6",
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  flowButtonPrimary: {
    backgroundColor: palette.ink,
  },
  flowButtonDisabled: {
    opacity: 0.35,
  },
  flowCenter: {
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  flowLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  flowLabel: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  progressDots: {
    flexDirection: "row",
    gap: 7,
  },
  progressDot: {
    backgroundColor: "#d8d1c5",
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  progressDotActive: {
    backgroundColor: palette.green,
    width: 24,
  },
  stack: {
    gap: 16,
  },
  photoPanel: {
    backgroundColor: "#2a302d",
    borderRadius: 20,
    minHeight: 300,
    overflow: "hidden",
  },
  roomPhoto: {
    height: 320,
    width: "100%",
  },
  annotatedWrap: {
    backgroundColor: "#2a302d",
    height: 320,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  photoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  detectBox: {
    borderRadius: 8,
    borderWidth: 2,
    position: "absolute",
  },
  boxLabel: {
    alignSelf: "flex-start",
    borderBottomRightRadius: 8,
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    maxWidth: 120,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  arrowLine: {
    backgroundColor: "#fff",
    height: 4,
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    transform: [{ rotate: "-14deg" }],
    width: 104,
  },
  arrowOne: {
    left: "31%",
    top: "47%",
  },
  arrowTwo: {
    left: "55%",
    top: "65%",
    transform: [{ rotate: "18deg" }],
    width: 86,
  },
  arrowHead: {
    borderBottomColor: "transparent",
    borderBottomWidth: 8,
    borderLeftColor: "#fff",
    borderLeftWidth: 14,
    borderTopColor: "transparent",
    borderTopWidth: 8,
    height: 0,
    position: "absolute",
    width: 0,
  },
  arrowHeadOne: {
    left: "58%",
    top: "43%",
    transform: [{ rotate: "-14deg" }],
  },
  arrowHeadTwo: {
    left: "76%",
    top: "67%",
    transform: [{ rotate: "18deg" }],
  },
  photoEmpty: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 300,
    padding: 24,
  },
  addCircle: {
    alignItems: "center",
    backgroundColor: palette.coral,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    marginBottom: 14,
    width: 56,
    shadowColor: palette.coral,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  photoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 6,
    textAlign: "center",
  },
  bodyText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyTextLight: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  scanBanner: {
    alignItems: "center",
    backgroundColor: "#e9f1ec",
    borderColor: "#cdded3",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  scanTitle: {
    color: palette.greenDark,
    fontSize: 14,
    fontWeight: "900",
  },
  panel: {
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    padding: 18,
    shadowColor: "#261f17",
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  panelTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  secondaryButton: {
    backgroundColor: "#e9f1ec",
    borderRadius: 12,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryText: {
    color: palette.greenDark,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.green,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 14,
    shadowColor: palette.green,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "800",
  },
  metrics: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    backgroundColor: "#f2eee6",
    borderRadius: 14,
    flex: 1,
    minHeight: 78,
    justifyContent: "center",
    padding: 12,
  },
  metricValue: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  metricLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  note: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  inventoryList: {
    gap: 10,
  },
  itemRow: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: palette.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  swatch: {
    borderRadius: 6,
    height: 56,
    width: 10,
  },
  itemFields: {
    flex: 1,
    gap: 7,
  },
  confidenceLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  detectedLabel: {
    color: palette.greenDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  confidenceText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#fffdf8",
    borderColor: palette.line,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.ink,
    minHeight: 40,
    paddingHorizontal: 10,
  },
  inputFocused: {
    borderColor: palette.green,
    borderWidth: 1.5,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#fff",
    borderColor: palette.line,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: palette.blue,
    borderColor: palette.blue,
  },
  chipText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#fff",
  },
  finding: {
    backgroundColor: "#fff",
    borderColor: palette.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  findingTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goal: {
    backgroundColor: "#fff",
    borderColor: palette.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goalActive: {
    backgroundColor: palette.green,
    borderColor: palette.green,
  },
  goalText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  goalTextActive: {
    color: "#fff",
  },
  conceptPanel: {
    backgroundColor: "#2a302d",
    borderRadius: 20,
    minHeight: 245,
    overflow: "hidden",
  },
  conceptPhoto: {
    height: 280,
    width: "100%",
  },
  conceptFallback: {
    backgroundColor: "#2a302d",
    height: 245,
  },
  overlayCard: {
    backgroundColor: "rgba(255,253,248,0.94)",
    borderRadius: 16,
    bottom: 14,
    left: 14,
    padding: 12,
    position: "absolute",
    right: 14,
  },
  overlayTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  overlayText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  planItem: {
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderColor: palette.line,
    borderLeftColor: palette.gold,
    borderLeftWidth: 5,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  planIndex: {
    alignItems: "center",
    backgroundColor: palette.gold,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  planIndexText: {
    color: "#fff",
    fontWeight: "800",
  },
  planTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
    textTransform: "capitalize",
  },
  scoreLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  scoreLabel: {
    color: palette.ink,
    fontWeight: "700",
    width: 74,
  },
  scoreTrack: {
    backgroundColor: "#ece5d9",
    borderRadius: 6,
    flex: 1,
    height: 12,
    overflow: "hidden",
  },
  scoreFill: {
    height: "100%",
    width: "100%",
  },
  scoreValue: {
    color: palette.ink,
    fontWeight: "800",
    width: 28,
  },
  summaryHero: {
    alignItems: "center",
    backgroundColor: "#e9f1ec",
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  summaryText: {
    color: palette.ink,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 12,
    lineHeight: 18,
  },
});
