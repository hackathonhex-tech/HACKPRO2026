import { NextResponse } from 'next/server';
import connectDB from '@/server/config/db';
import { Timer } from '@/server/models/Timer';
import { verifyApiAuth } from '@/server/middleware/apiAuth';

// GET the current timer state
export async function GET() {
  try {
    await connectDB();
    
    // Find the first (and only) timer document
    let timer = await Timer.findOne();
    
    // If it doesn't exist, create the default one
    if (!timer) {
      timer = await Timer.create({
        status: 'STOPPED',
        durationRemaining: 0,
        endTime: null,
        automaticBuzzer: true,
        autoBuzzerTriggerTime: 0,
        lastManualBuzzer: null
      });
    }

    return NextResponse.json({ success: true, timer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST updates to the timer state (Admin)
export async function POST(req: Request) {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin'], 'manage_settings');
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, payload } = body;
    
    await connectDB();
    
    let timer = await Timer.findOne();
    if (!timer) {
      timer = await Timer.create({
        status: 'STOPPED',
        durationRemaining: 0,
        endTime: null,
        automaticBuzzer: true,
        autoBuzzerTriggerTime: 0,
        lastManualBuzzer: null
      });
    }

    switch (action) {
      case 'SET':
        // payload should be duration in seconds
        timer.durationRemaining = payload.duration;
        timer.status = 'STOPPED';
        timer.endTime = null;
        break;
      
      case 'START':
        if (timer.status !== 'RUNNING' && timer.durationRemaining > 0) {
          timer.status = 'RUNNING';
          // Calculate the end time precisely
          timer.endTime = new Date(Date.now() + timer.durationRemaining * 1000);
        }
        break;
      
      case 'PAUSE':
        if (timer.status === 'RUNNING' && timer.endTime) {
          timer.status = 'PAUSED';
          // Calculate remaining seconds
          const diff = Math.max(0, timer.endTime.getTime() - Date.now());
          timer.durationRemaining = Math.ceil(diff / 1000);
          timer.endTime = null;
        }
        break;
      
      case 'STOP':
        timer.status = 'STOPPED';
        timer.durationRemaining = 0;
        timer.endTime = null;
        break;
        
      case 'TRIGGER_BUZZER':
        timer.lastManualBuzzer = new Date();
        break;
        
      case 'TOGGLE_AUTO_BUZZER':
        timer.automaticBuzzer = !!payload.enabled;
        break;
        
      case 'SET_AUTO_BUZZER_TIME':
        timer.autoBuzzerTriggerTime = payload.triggerTime || 0;
        break;
        
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await timer.save();
    return NextResponse.json({ success: true, timer });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
