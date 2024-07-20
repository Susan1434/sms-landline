import express from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
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