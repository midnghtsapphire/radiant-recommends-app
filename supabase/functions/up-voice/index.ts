import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_FREE_MODELS = [
  "openrouter/free",
  "tngtech/deepseek-r1t2-chimera:free",
  "arcee-ai/trinity-large-preview:free",
];

interface VoiceRequest {
  action: "tts_generate" | "stt_transcribe" | "voice_script" | "podcast_outline" | "audio_plan";
  text?: string;
  voice_style?: string;
  language?: string;
  topic?: string;
  format?: string;
}

async function callOpenRouter(prompt: string, model?: string): Promise<string> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  const selectedModel = model || OPENROUTER_FREE_MODELS[0];
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://lovable.dev",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
    }),
  });
  if (!resp.ok) throw new Error(`OpenRouter [${resp.status}]: ${await resp.text()}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callLovableAI(prompt: string): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not set");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limited — try again shortly");
    if (resp.status === 402) throw new Error("Credits exhausted — add credits in workspace settings");
    throw new Error(`AI [${resp.status}]: ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Auth failed");

    const body: VoiceRequest = await req.json();
    const { action } = body;

    let result: any;

    switch (action) {
      case "tts_generate": {
        // Generate TTS script optimized for voice delivery + SSML markup
        const prompt = `You are an expert voice engineer. Convert this text into an optimized voice script with SSML-like markup for open-source TTS engines (Coqui TTS, Piper, Bark).

Text: "${body.text}"
Voice style: ${body.voice_style || "professional, warm"}
Language: ${body.language || "en"}

Return JSON:
{
  "optimized_text": "text with natural pauses and emphasis",
  "ssml": "<speak>SSML version</speak>",
  "voice_recommendations": ["list of recommended open-source voices"],
  "coqui_config": { "model": "recommended model", "speaker": "speaker id" },
  "piper_config": { "voice": "recommended voice", "speed": 1.0 },
  "bark_config": { "speaker": "v2/en_speaker_6", "temperature": 0.7 },
  "estimated_duration_seconds": 0,
  "pronunciation_notes": ["any special pronunciation guidance"]
}`;
        const raw = await callOpenRouter(prompt, OPENROUTER_FREE_MODELS[1]);
        result = { action: "tts_generate", raw_output: raw, engine: "openrouter/deepseek" };
        break;
      }

      case "stt_transcribe": {
        // Generate transcription pipeline config using Whisper
        const prompt = `You are an expert in speech-to-text systems. Design a transcription pipeline using OpenAI Whisper (open-source, free).

Requirements:
- Audio format: ${body.format || "mp3/wav/webm"}
- Language: ${body.language || "auto-detect"}
- Features needed: word-level timestamps, speaker diarization, punctuation

Return JSON:
{
  "whisper_config": {
    "model_size": "base or small or medium or large-v3",
    "language": "auto",
    "task": "transcribe",
    "word_timestamps": true,
    "vad_filter": true
  },
  "deployment_options": [
    { "name": "Local Python", "command": "pip install openai-whisper && whisper audio.mp3", "cost": "Free" },
    { "name": "Whisper.cpp", "command": "build instructions", "cost": "Free" },
    { "name": "HuggingFace Inference", "url": "https://huggingface.co/openai/whisper-large-v3", "cost": "Free tier" }
  ],
  "diarization": {
    "tool": "pyannote/speaker-diarization",
    "setup": "pip install pyannote.audio"
  },
  "post_processing": ["punctuation restoration", "sentence segmentation", "speaker labels"],
  "output_formats": ["srt", "vtt", "json", "txt"]
}`;
        const raw = await callOpenRouter(prompt, OPENROUTER_FREE_MODELS[2]);
        result = { action: "stt_transcribe", raw_output: raw, engine: "openrouter/arcee" };
        break;
      }

      case "voice_script": {
        // Generate a marketing voice script
        const prompt = `Create a professional voice-over script for a hair care / beauty marketing video.

Topic: ${body.topic || "hair care product promotion"}
Style: ${body.voice_style || "warm, authoritative, trustworthy"}
Duration target: 30-60 seconds

Return JSON:
{
  "script": "the full script with [PAUSE] [EMPHASIS] markers",
  "duration_estimate": "45 seconds",
  "voice_direction": "warm female voice, conversational tone",
  "music_suggestions": ["royalty-free music recommendations"],
  "sound_effects": ["suggested SFX at key moments"],
  "cta": "call to action line",
  "platforms": {
    "tiktok": "15-sec version",
    "instagram": "30-sec version",
    "youtube": "60-sec version"
  }
}`;
        const raw = await callLovableAI(prompt);
        result = { action: "voice_script", raw_output: raw, engine: "gemini-3-flash" };
        break;
      }

      case "podcast_outline": {
        // Generate podcast episode from topic
        const prompt = `Create a complete podcast episode outline for an open-source podcast generator.

Topic: ${body.topic || "hair care science and anti-aging"}
Format: ${body.format || "solo host, 10-15 minutes"}

Return JSON:
{
  "title": "episode title",
  "description": "episode description for RSS",
  "segments": [
    { "type": "intro", "duration": "30s", "script": "intro script", "music": "upbeat intro" },
    { "type": "main", "duration": "8min", "script": "main content", "talking_points": [] },
    { "type": "ad_break", "duration": "30s", "script": "affiliate mention for hair products" },
    { "type": "outro", "duration": "30s", "script": "outro with CTA" }
  ],
  "tts_voices": {
    "host": { "engine": "coqui", "voice": "recommended" },
    "guest": { "engine": "bark", "voice": "recommended" }
  },
  "seo_tags": [],
  "affiliate_integration": { "tag": "meetaudreyeva-20", "products_to_mention": [] }
}`;
        const raw = await callOpenRouter(prompt);
        result = { action: "podcast_outline", raw_output: raw, engine: "openrouter/free" };
        break;
      }

      case "audio_plan": {
        // Full audio processing pipeline design
        const prompt = `Design a complete open-source audio processing pipeline for a voice SaaS.

Requirements: noise reduction, normalization, format conversion, podcast editing.
All tools must be FREE and open-source.

Return JSON:
{
  "pipeline_steps": [
    { "step": "input", "tools": ["FFmpeg"], "command": "ffmpeg -i input.mp3 -ar 44100 output.wav" },
    { "step": "noise_reduction", "tools": ["RNNoise", "noisereduce"], "setup": "pip install noisereduce" },
    { "step": "normalization", "tools": ["FFmpeg loudnorm", "pyloudnorm"], "command": "" },
    { "step": "silence_removal", "tools": ["pydub", "FFmpeg"], "command": "" },
    { "step": "format_export", "tools": ["FFmpeg"], "formats": ["mp3", "wav", "ogg", "flac"] }
  ],
  "recommended_stack": {
    "tts": ["Coqui TTS", "Piper", "Bark"],
    "stt": ["Whisper", "Vosk"],
    "processing": ["FFmpeg", "SoX", "pydub"],
    "streaming": ["WebRTC", "MediaStream API"],
    "hosting": ["Supabase Storage", "Cloudflare R2"]
  },
  "api_design": {
    "endpoints": [
      { "path": "/tts", "method": "POST", "desc": "Text to speech" },
      { "path": "/stt", "method": "POST", "desc": "Speech to text" },
      { "path": "/clone", "method": "POST", "desc": "Voice cloning" },
      { "path": "/process", "method": "POST", "desc": "Audio processing" }
    ]
  },
  "cost_comparison": {
    "elevenlabs": "$22/mo for 100k chars",
    "this_solution": "$0 — fully open-source"
  }
}`;
        const raw = await callOpenRouter(prompt, OPENROUTER_FREE_MODELS[1]);
        result = { action: "audio_plan", raw_output: raw, engine: "openrouter/deepseek" };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("up-voice error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
