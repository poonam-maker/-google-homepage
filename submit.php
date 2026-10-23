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

$sent = mail($STORE_EMAIL, "New website lead", implode("\n", $lines), $headers, "-f" . $MAIL_FROM);

http_response_code($sent ? 200 : 500);
echo json_encode(["ok" => $sent]);
