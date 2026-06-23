export async function GET() {
  return Response.json({
    ok: true,
    service: "peluqueria-app",
    timestamp: new Date().toISOString(),
  });
}
