// src/components/emails/ReminderEmail.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import { AppConfig } from '@/lib/settings';

interface ReminderEmailProps {
  studentName: string;
  feeName: string;
  dueDate: string;
  amount: number;
}

export const ReminderEmailTemplate = ({
  studentName,
  feeName,
  dueDate,
  amount,
}: ReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment Reminder for {feeName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Reminder</Heading>
        <Text style={text}>Dear Parent/Guardian,</Text>
        
        <Text style={text}>
          This is a friendly reminder regarding the upcoming fee payment for <strong>{studentName}</strong>.
        </Text>
        
        <Container style={boxContainer}>
          <Text style={boxText}>
            <strong>Fee Type:</strong> {feeName}
          </Text>
          <Text style={boxText}>
            <strong>Amount Due:</strong> GH₵{amount.toFixed(2)}
          </Text>
          <Text style={boxText}>
            <strong>Due Date:</strong> {dueDate}
          </Text>
        </Container>

        <Text style={text}>
          Please ensure timely payment to avoid any interruption in school services.
          You can make the payment through the parent portal or at the school office.
        </Text>

        <Container style={buttonContainer}>
          <Link href={`${AppConfig.BASE_URL}/fees`} style={button}>
            View Details & Pay Now
          </Link>
        </Container>

        <Text style={footer}>
          If you have already made the payment, please disregard this reminder.
          For any questions, contact {AppConfig.SUPPORT_EMAIL}.
          <br /><br />
          Best regards,<br />
          {AppConfig.SCHOOL_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '24px',
  fontWeight: '500',
  lineHeight: '1.3',
  margin: '16px 0',
  padding: '0 48px',
};

const text = {
  color: '#374151',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 48px',
  margin: '16px 0',
};

const boxContainer = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  margin: '24px 48px',
  padding: '24px',
};

const boxText = {
  color: '#374151',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const buttonContainer = {
  padding: '0 48px',
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  display: 'inline-block',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
};

const footer = {
  color: '#666',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '14px',
  margin: '32px 0 0',
  padding: '0 48px',
};
