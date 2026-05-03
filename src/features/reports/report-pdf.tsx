import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { AuditBundle } from "@/lib/types";
import { suiteLabels } from "@/features/audits/constants";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#0f172a", fontFamily: "Helvetica" },
  h1: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
  h2: { fontSize: 14, fontWeight: 700, marginTop: 18, marginBottom: 8 },
  muted: { color: "#64748b", marginBottom: 16 },
  score: { fontSize: 40, fontWeight: 700, marginBottom: 12 },
  row: { flexDirection: "row", gap: 12, marginBottom: 10 },
  card: { border: "1px solid #e2e8f0", borderRadius: 6, padding: 10, flex: 1 },
  label: { fontSize: 8, textTransform: "uppercase", color: "#64748b", marginBottom: 4 },
  body: { lineHeight: 1.5 },
});

export function ReportDocument({ bundle }: { bundle: AuditBundle }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>AgentCheck QA Report</Text>
        <Text style={styles.muted}>{bundle.audit.companyName}</Text>
        <Text style={styles.score}>{bundle.result?.overallScore ?? bundle.audit.finalScore ?? 0}/100</Text>

        <Text style={styles.h2}>Risk Categories</Text>
        <View style={styles.row}>
          {Object.entries(bundle.result?.riskCategories ?? {}).map(([suite, risk]) => (
            <View key={suite} style={styles.card}>
              <Text style={styles.label}>{suiteLabels[suite as keyof typeof suiteLabels]}</Text>
              <Text>{risk}% risk</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>Failed Test Cases</Text>
        {bundle.testCases
          .filter((testCase) => !testCase.passed)
          .map((testCase) => (
            <View key={testCase.id} style={styles.card}>
              <Text style={styles.label}>{suiteLabels[testCase.suite]}</Text>
              <Text style={styles.body}>
                {testCase.persona}: {testCase.objective} Score: {testCase.score}/100
              </Text>
            </View>
          ))}

        <Text style={styles.h2}>Suggested Prompt Fixes</Text>
        {(bundle.result?.promptFixes ?? []).map((fix) => (
          <Text key={fix} style={styles.body}>• {fix}</Text>
        ))}
      </Page>
    </Document>
  );
}

export async function renderReportPdf(bundle: AuditBundle) {
  return renderToBuffer(<ReportDocument bundle={bundle} />);
}
