<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$CM_API_KEY = "12716220128b11143e674fde1dc6fc56";
$CM_LIST_ID = "6C9D3FC5F702B592";

$STORE_EMAIL = "brunette@coquitlam.petplanet.ca";
$MAIL_FROM   = "noreply@daycare.petplanet.ca";

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || empty($data["EmailAddress"])) {
  http_response_code(400);
  echo json_encode(["error" => "Missing email"]);
  exit;
}

function oneLine($s) {
  return trim(str_replace(["\r", "\n"], " ", (string)$s));
}

$lines = [
  "Name: " . oneLine($data["Name"] ?? ""),
  "Email: " . oneLine($data["EmailAddress"]),
];
foreach (($data["CustomFields"] ?? []) as $f) {
  if (!isset($f["Key"], $f["Value"]) || trim((string)$f["Value"]) === "") continue;
  $lines[] = oneLine($f["Key"]) . ": " . trim((string)$f["Value"]);
}
$lines[] = "Submitted: " . date("Y-m-d H:i:s T");

$headers = "From: Pet Planet Brunette Website <{$MAIL_FROM}>\r\n";
$replyTo = filter_var(oneLine($data["EmailAddress"]), FILTER_VALIDATE_EMAIL);
if ($replyTo) $headers .= "Reply-To: {$replyTo}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$mailOk = mail($STORE_EMAIL, "New website lead", implode("\n", $lines), $headers, "-f" . $MAIL_FROM);

// City isn't a Campaign Monitor custom field, so leave it out of that request
$cmData = $data;
$cmData["CustomFields"] = array_values(array_filter(
  $data["CustomFields"] ?? [],
  function ($f) { return !isset($f["Key"]) || $f["Key"] !== "City"; }
));

$ch = curl_init("https://api.createsend.com/api/v3.2/subscribers/{$CM_LIST_ID}.json");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($cmData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json",
  "Authorization: Basic " . base64_encode($CM_API_KEY . ":x")
]);
$response = curl_exec($ch);
$status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($mailOk && ($status >= 400 || $status === 0)) {
  http_response_code(200);
  echo json_encode(["emailed" => true]);
  exit;
}

http_response_code($status ?: 502);
echo $response;
