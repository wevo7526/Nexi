import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const response = await fetch('http://localhost:5000/api/multi-agent/get_answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      return NextResponse.json(
        { success: false, error: errorData.message || 'Failed to process request' },
        { status: response.status }
      );
    }

    // Create a TransformStream to handle the SSE data
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process the response stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to initialize stream reader');
    }

    // Start processing the stream
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('Processing SSE data:', data);
                
                if (data.type === 'response') {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({
                    type: 'response',
                    content: data.content
                  })}\n\n`));
                } else if (data.type === 'error') {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({
                    type: 'error',
                    content: data.content
                  })}\n\n`));
                }
              } catch (err) {
                console.error('Error processing SSE data:', err);
                await writer.write(encoder.encode(`data: ${JSON.stringify({
                  type: 'error',
                  content: 'Failed to process server response'
                })}\n\n`));
              }
            }
          }
        }
        await writer.close();
      } catch (err) {
        console.error('Stream processing error:', err);
        await writer.abort(err);
      }
    })();

    // Return the readable stream with proper headers
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API route error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 