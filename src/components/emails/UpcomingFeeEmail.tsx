// src/components/emails/UpcomingFeeEmail.tsx
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

interface UpcomingFeeEmailProps {
  studentName: string;
  feeName: string;
  dueDate: string;
  amount: number;
  daysUntilDue: number;
}

export const UpcomingFeeEmailTemplate = ({
  studentName,
  feeName,
  dueDate,
  amount,
  daysUntilDue,
}: UpcomingFeeEmailProps) => (
  <Html>
    <Head />
    <Preview>Upcoming Fee Payment for {feeName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Upcoming Fee Payment</Heading>
        <Text style={text}>Dear Parent/Guardian,</Text>
        
        <Text style={text}>
          This is a friendly reminder that a fee payment for <strong>{studentName}</strong> will be due in {daysUntilDue} days.
        </Text>
        
        <Container style={boxContainer}>
          <Text style={boxText}>
            <strong>Fee Type:</strong> {feeName}
          </Text>
          <Text style={boxText}>
            <strong>Due Date:</strong> {dueDate}
          </Text>
          <Text style={boxText}>
            <strong>Amount Due:</strong> GH₵{amount.toFixed(2)}
          </Text>
        </Container>

        <Text style={text}>
          Please ensure timely payment to avoid any late fees. If you have already made the payment, please disregard this message.
        </Text>

        <Text style={text}>
          You can make the payment through our online portal at{' '}          <Link href={`${AppConfig.BASE_URL}/fees`} style={link}>
            {AppConfig.BASE_URL}/fees
          </Link>
        </Text>

        <Text style={text}>Best regards,</Text>
        <Text style={text}>{AppConfig.SCHOOL_NAME}</Text>
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
  padding: '40px 20px',
  borderRadius: '5px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 20px',
};

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 15px',
};

const boxContainer = {
  backgroundColor: '#f8fafc',
  borderRadius: '5px',
  padding: '20px',
  margin: '20px 0',
};

const boxText = {
  margin: '10px 0',
  fontSize: '15px',
  color: '#334155',
};

const link = {
  color: '#6366f1',
  textDecoration: 'underline',
};
