import express from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Supabase config
const supabaseUrl = 'https://qiqdlonmcwsyncnbfigl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcWRsb25tY3dzeW5jbmJmaWdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMTQ2MzQwNSwiZXhwIjoyMDM3MDM5NDA1fQ.Bj96lbyRm48HuZaQsBWQIQIgccjy8zEVlfwozR1v3Sg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Twilio configuration
const accountSid = 'ACa3d4137f41a1ac3825d183810d5b4df2';
const authToken = '430efbc4ef948d48b8a2c068cbafb890';
const twilioClient = new twilio(accountSid, authToken);

// To handle incoming SMS from Twilio
app.post('/sms-receive', async (req, res) => {
  const { From, Body } = req.body;

  try {
    // Find the landline ID from the phone number
    const { data: landline, error: landlineError } = await supabase
      .from('landlines')
      .select('id')
      .eq('phone_number', From)
      .single();

    if (landlineError) {
      throw landlineError;
    }

    // Store the message in Supabase
    const { data, error } = await supabase
      .from('messages')
      .insert([{ landline_id: landline.id, message: Body, from_number: From }]);

    if (error) {
      throw error;
    }

    res.status(200).send('Message received');
  } catch (error) {
    console.error('Error storing message:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});