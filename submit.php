<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$STORE_EMAIL = "brunette@coquitlam.petplanet.ca";
$MAIL_FROM   = "noreply@daycare.petplanet.ca";

$data = json_decode(file_get_contents("php://input"), true);
$email = is_array($data) ? trim((string)($data["email"] ?? "")) : "";
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(["error" => "Missing or invalid email"]);
  exit;
}

function oneLine($s) {
  return trim(str_replace(["\r", "\n"], " ", (string)$s));
}

$lines = [];
foreach ($data as $key => $value) {
  if (!is_scalar($value) || trim((string)$value) === "") continue;
  $lines[] = oneLine($key) . ": " . trim((string)$value);
}

$headers = "From: Pet Planet Brunette Website <{$MAIL_FROM}>\r\n"
         . "Reply-To: {$email}\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = mail($STORE_EMAIL, "NEW WEBSITE LEAD", implode("\n", $lines), $headers, "-f" . $MAIL_FROM);

// Confirmation email to the person who submitted the form
$fullName  = oneLine($data["parent_name"] ?? $data["name"] ?? "");
$firstName = $fullName !== "" ? explode(" ", $fullName)[0] : "there";
$services = [
  "daycare" => "Dog Daycare",
  "boarding" => "Overnight Boarding",
  "grooming" => "Grooming & Spa",
  "daycare-boarding" => "Daycare + Boarding",
  "not-sure" => "Not sure yet",
];
$visitDate = isset($data["visit_date"]) ? strtotime($data["visit_date"]) : false;

if ($visitDate) {
  $confirmSubject = "We received your free first visit request - Pet Planet Brunette";
  $details = "Date: " . date("l, F j, Y", $visitDate) . "\n"
           . "Time: " . oneLine($data["visit_time"] ?? "") . "\n";
  $svc = $data["service"] ?? "";
  if ($svc !== "") $details .= "Service: " . ($services[$svc] ?? oneLine($svc)) . "\n";
  $confirmBody = "Hi {$firstName},\n\n"
    . "Thanks for booking your free first visit at Pet Planet Brunette. We've received your request:\n\n"
    . $details . "\n"
    . "Our team will follow up to confirm. If you need to change anything, just reply to this email or call us at (778) 397-1364.\n\n";
} else {
  $confirmSubject = "We received your message - Pet Planet Brunette";
  $confirmBody = "Hi {$firstName},\n\n"
    . "Thanks for contacting Pet Planet Brunette. We've received your message and will get back to you soon. "
    . "If it's urgent, you can reach us at (778) 397-1364.\n\n";
}
$confirmBody .= "Pet Planet Brunette Dog Daycare\n822 Brunette Ave, Coquitlam, BC V3K 1C4\n";

$confirmHeaders = "From: Pet Planet Brunette <{$MAIL_FROM}>\r\n"
                . "Reply-To: {$STORE_EMAIL}\r\n"
                . "Content-Type: text/plain; charset=UTF-8\r\n";
mail($email, $confirmSubject, $confirmBody, $confirmHeaders, "-f" . $MAIL_FROM);

http_response_code($sent ? 200 : 500);
echo json_encode(["ok" => $sent]);
