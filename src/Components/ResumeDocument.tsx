// src/components/ResumeDocument.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type{ ResumeData, ExperienceItem, EducationItem } from '../Components/types/resume'; // Adjust path

// Register a font if you want custom fonts for consistency
// You can download .ttf files and serve them or use Google Fonts links.
// Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica', // Default font, change if you register one
  },
  section: {
    marginBottom: 15,
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  contactInfo: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 4,
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  listItem: {
    fontSize: 11,
    marginBottom: 3,
    lineHeight: 1.3,
  },
  subheading: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtext: {
    fontSize: 10,
    marginBottom: 2,
  },
});

interface ResumeDocumentProps {
  data: ResumeData;
}

const ResumeDocument: React.FC<ResumeDocumentProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>{data.name}</Text>
        <Text style={styles.contactInfo}>
          {data.email} {data.phone && ` | ${data.phone}`}
          {data.linkedin && ` | LinkedIn: ${data.linkedin}`}
          {data.github && ` | GitHub: ${data.github}`}
        </Text>
        <Text style={styles.paragraph}>{data.summary}</Text>
      </View>

      {data.experience && data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.experience.map((item: ExperienceItem, index: number) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={styles.subheading}>{item.title}</Text>
              <Text style={styles.subtext}>{item.company} | {item.duration}</Text>
              <Text style={styles.listItem}>{item.description}</Text>
            </View>
          ))}
        </View>
      )}

      {data.education && data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.education.map((item: EducationItem, index: number) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={styles.subheading}>{item.degree}</Text>
              <Text style={styles.subtext}>{item.institution} | {item.year}</Text>
            </View>
          ))}
        </View>
      )}

      {data.skills && data.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.paragraph}>{data.skills.join(', ')}</Text>
        </View>
      )}

      {data.projects && data.projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {data.projects.map((item, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={styles.subheading}>{item.name}</Text>
              <Text style={styles.listItem}>{item.description}</Text>
              {item.link && <Text style={styles.subtext}>Link: {item.link}</Text>}
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

export default ResumeDocument;