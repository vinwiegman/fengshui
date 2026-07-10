import React, { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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
  { id: "bed_1", label: "Bed", type: "bed", movable: false },
  { id: "desk_1", label: "Desk", type: "desk", movable: true },
  { id: "chair_1", label: "Chair", type: "chair", movable: true },
  { id: "wardrobe_1", label: "Wardrobe", type: "wardrobe", movable: false },
  { id: "clutter_1", label: "Floor clutter", type: "clutter", movable: true },
];

const constraintOptions = [
  "no purchases",
  "do not move bed",
  "do not block door",
  "retain wardrobe access",
  "keep desk usable",
];

export default function App() {
  const [step, setStep] = useState("photo");
  const [photo, setPhoto] = useState(null);
  const [objects, setObjects] = useState(starterObjects);
  const [goal, setGoal] = useState(goals[0]);
  const [constraints, setConstraints] = useState(["no purchases", "do not block door", "retain wardrobe access"]);

  const analysis = useMemo(() => buildAnalysis(objects, constraints), [objects, constraints]);
  const plan = useMemo(() => generatePlan(objects, goal), [objects, goal]);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.88,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  }

  function updateObject(id, patch) {
    setObjects((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addObject() {
    const next = objects.length + 1;
    setObjects((current) => [
      ...current,
      { id: `item_${next}`, label: `Item ${next}`, type: "clutter", movable: true },
    ]);
  }

  function toggleConstraint(value) {
    setConstraints((current) =>
      current.includes(value) ? current.filter((constraint) => constraint !== value) : [...current, value],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Interior assistant</Text>
            <Text style={styles.title}>RoomRead</Text>
          </View>
          <View style={styles.zeroBadge}>
            <Ionicons name="cash-outline" color={palette.greenDark} size={18} />
            <Text style={styles.zeroBadgeText}>Zero-budget</Text>
          </View>
        </View>

        <StepTabs value={step} onChange={setStep} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {step === "photo" && <PhotoScreen photo={photo} pickImage={pickImage} />}
          {step === "inventory" && (
            <InventoryScreen
              objects={objects}
              updateObject={updateObject}
              addObject={addObject}
              constraints={constraints}
              toggleConstraint={toggleConstraint}
            />
          )}
          {step === "analysis" && <AnalysisScreen analysis={analysis} goal={goal} setGoal={setGoal} />}
          {step === "plan" && <PlanScreen photo={photo} plan={plan} analysis={analysis} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepTabs({ value, onChange }) {
  return (
    <View style={styles.tabs}>
      {steps.map((item) => {
        const active = item.id === value;
        return (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Ionicons name={item.icon} size={17} color={active ? "#fff" : palette.muted} />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PhotoScreen({ photo, pickImage }) {
  return (
    <View style={styles.stack}>
      <Pressable style={styles.photoPanel} onPress={pickImage}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.roomPhoto} />
        ) : (
          <View style={styles.photoEmpty}>
            <View style={styles.addCircle}>
              <Ionicons name="add" size={32} color="#fff" />
            </View>
            <Text style={styles.photoTitle}>Upload one bedroom photo</Text>
            <Text style={styles.bodyText}>Use a clear wide shot with furniture, floor, and doorway visible.</Text>
          </View>
        )}
      </Pressable>

      <Panel title="Capture checks">
        <View style={styles.metrics}>
          <Metric value={photo ? "ready" : "needed"} label="photo" />
          <Metric value={photo?.width > photo?.height ? "wide" : photo ? "portrait" : "--"} label="coverage" />
          <Metric value="manual" label="detection" />
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
          {objects.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={[styles.swatch, { backgroundColor: colorForType(item.type) }]} />
              <View style={styles.itemFields}>
                <TextInput
                  value={item.label}
                  onChangeText={(label) => updateObject(item.id, { label })}
                  style={styles.input}
                  placeholder="Object label"
                  placeholderTextColor={palette.muted}
                />
                <TextInput
                  value={item.type}
                  onChangeText={(type) => updateObject(item.id, { type: type.toLowerCase() })}
                  style={styles.input}
                  placeholder="type"
                  placeholderTextColor={palette.muted}
                />
              </View>
              <Switch
                value={item.movable}
                onValueChange={(movable) => updateObject(item.id, { movable })}
                trackColor={{ true: palette.green, false: "#d8d2c8" }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>
      </Panel>

      <Panel title="Hard constraints">
        <View style={styles.chipWrap}>
          {constraintOptions.map((constraint) => {
            const active = constraints.includes(constraint);
            return (
              <Pressable
                key={constraint}
                onPress={() => toggleConstraint(constraint)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{constraint}</Text>
              </Pressable>
            );
          })}
        </View>
      </Panel>
    </View>
  );
}

function AnalysisScreen({ analysis, goal, setGoal }) {
  return (
    <View style={styles.stack}>
      <Panel eyebrow="Room profile" title={analysis.category}>
        <View style={styles.metrics}>
          <Metric value={analysis.calm} label="calm" />
          <Metric value={analysis.clutter} label="clutter" />
          <Metric value={analysis.flow} label="flow" />
        </View>
      </Panel>

      <Panel title="Findings">
        {analysis.findings.map((finding) => (
          <View key={finding.title} style={styles.finding}>
            <Text style={styles.findingTitle}>{finding.title}</Text>
            <Text style={styles.bodyText}>{finding.body}</Text>
          </View>
        ))}
      </Panel>

      <Panel title="Redesign goal">
        <View style={styles.goalGrid}>
          {goals.map((item) => {
            const active = item === goal;
            return (
              <Pressable key={item} onPress={() => setGoal(item)} style={[styles.goal, active && styles.goalActive]}>
                <Text style={[styles.goalText, active && styles.goalTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </Panel>
    </View>
  );
}

function PlanScreen({ photo, plan, analysis }) {
  return (
    <View style={styles.stack}>
      <View style={styles.conceptPanel}>
        {photo ? <Image source={{ uri: photo.uri }} style={styles.conceptPhoto} /> : <View style={styles.conceptFallback} />}
        <View style={styles.overlayCard}>
          <Text style={styles.overlayTitle}>Concept overlay</Text>
          <Text style={styles.overlayText}>Arrows and actions are planning guidance, not measured fit proof.</Text>
        </View>
      </View>

      <Panel title="Rearrangement plan">
        {plan.map((item) => (
          <View key={item.step} style={styles.planItem}>
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
          </View>
        ))}
      </Panel>

      <Panel title="Before / after score">
        <View style={styles.scoreLine}>
          <Text style={styles.scoreLabel}>Current</Text>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${analysis.flow}%`, backgroundColor: palette.coral }]} />
          </View>
          <Text style={styles.scoreValue}>{analysis.flow}</Text>
        </View>
        <View style={styles.scoreLine}>
          <Text style={styles.scoreLabel}>After plan</Text>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${Math.min(94, analysis.flow + 22)}%` }]} />
          </View>
          <Text style={styles.scoreValue}>{Math.min(94, analysis.flow + 22)}</Text>
        </View>
      </Panel>
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
          <Pressable onPress={onAction} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>{actionLabel}</Text>
          </Pressable>
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

function buildAnalysis(objects, constraints) {
  const clutterCount = objects.filter((item) => ["clutter", "clothing", "boxes"].includes(item.type)).length;
  const movableCount = objects.filter((item) => item.movable).length;
  const hasDesk = objects.some((item) => item.type === "desk");
  const hasChair = objects.some((item) => item.type === "chair");
  const flow = Math.max(30, 78 - clutterCount * 14);
  const calm = Math.max(28, 74 - clutterCount * 11 + (constraints.includes("no purchases") ? 4 : 0));
  const clutter = Math.min(95, 28 + clutterCount * 23);

  return {
    category: movableCount > 3 ? "Student room, flexible layout" : "Bedroom, fixed-furniture layout",
    flow,
    calm,
    clutter,
    findings: [
      {
        title: "Likely style",
        body: "Practical modern bedroom with mixed storage. Confidence is low until real scene understanding is connected.",
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  eyebrow: {
    color: palette.greenDark,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: palette.ink,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
  },
  zeroBadge: {
    alignItems: "center",
    backgroundColor: "#e9f1ec",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 10,
  },
  zeroBadgeText: {
    color: palette.greenDark,
    fontWeight: "800",
  },
  tabs: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tab: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minHeight: 48,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
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
    padding: 16,
    paddingBottom: 34,
  },
  stack: {
    gap: 14,
  },
  photoPanel: {
    backgroundColor: "#2a302d",
    borderRadius: 8,
    minHeight: 300,
    overflow: "hidden",
  },
  roomPhoto: {
    height: 320,
    width: "100%",
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
    marginBottom: 12,
    width: 56,
  },
  photoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
    textAlign: "center",
  },
  bodyText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    shadowColor: "#261f17",
    shadowOpacity: 0.12,
    shadowRadius: 18,
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
    fontSize: 19,
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: "#e9f1ec",
    borderRadius: 8,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryText: {
    color: palette.greenDark,
    fontWeight: "900",
  },
  metrics: {
    flexDirection: "row",
    gap: 9,
  },
  metric: {
    backgroundColor: "#f2eee6",
    borderRadius: 8,
    flex: 1,
    minHeight: 78,
    justifyContent: "center",
    padding: 11,
  },
  metricValue: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "900",
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
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  swatch: {
    borderRadius: 8,
    height: 56,
    width: 12,
  },
  itemFields: {
    flex: 1,
    gap: 7,
  },
  input: {
    backgroundColor: "#fffdf8",
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    color: palette.ink,
    minHeight: 40,
    paddingHorizontal: 10,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#fff",
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 11,
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
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  findingTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goal: {
    backgroundColor: "#fff",
    borderColor: palette.line,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 11,
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
    borderRadius: 8,
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
    borderRadius: 8,
    bottom: 14,
    left: 14,
    padding: 12,
    position: "absolute",
    right: 14,
  },
  overlayTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "900",
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
    borderLeftWidth: 6,
    borderRadius: 8,
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
    fontWeight: "900",
  },
  planTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "900",
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
    fontWeight: "800",
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
    backgroundColor: palette.green,
    height: "100%",
  },
  scoreValue: {
    color: palette.ink,
    fontWeight: "900",
    width: 28,
  },
});
