
import { NextRequest, NextResponse } from 'next/server';

// This is a Route Handler that acts as a proxy for the B&O notification endpoint.
// It allows the client-side code to bypass CORS issues.

export const dynamic = 'force-dynamic'; // Ensures this route is not cached

export async function GET(
  request: NextRequest,
  { params }: { params: { ip: string } }
) {
  const ip = params.ip;

  if (!ip) {
    return new NextResponse('IP address is required', { status: 400 });
  }

  // The AbortController is used to automatically close the connection
  // if the client disconnects.
  const controller = new AbortController();
  request.signal.addEventListener('abort', () => {
    controller.abort();
  });

  try {
    const beoResponse = await fetch(`http://${ip}:8080/BeoNotify/Notifications`, {
      signal: controller.signal, // Pass the abort signal to the fetch request
      cache: 'no-store',
    });

    if (!beoResponse.ok) {
      // Pass through the error status from the device
      return new NextResponse(beoResponse.statusText, { status: beoResponse.status });
    }

    const data = await beoResponse.json();

    return NextResponse.json(data);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Request to device was aborted (client disconnected).');
      // The client disconnected, so we don't need to send a response.
      // We return an empty response with a 204 No Content status.
      return new NextResponse(null, { status: 204 });
    }
    console.error(`Error fetching notifications from ${ip}:`, error);
    return new NextResponse('Error connecting to the device', { status: 502 }); // Bad Gateway
  }
}
