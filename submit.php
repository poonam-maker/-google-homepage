<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$CM_API_KEY = "12716220128b11143e674fde1dc6fc56";
$CM_LIST_ID = "6C9D3FC5F702B592";

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || empty($data["EmailAddress"])) {
  http_response_code(400);
  echo json_encode(["error" => "Missing email"]);
  exit;
}

$ch = curl_init("https://api.createsend.com/api/v3.2/subscribers/{$CM_LIST_ID}.json");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json",
  "Authorization: Basic " . base64_encode($CM_API_KEY . ":x")
]);
$response = curl_exec($ch);
$status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($status);
echo $response;
