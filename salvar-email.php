<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const LIMITE_ARQUIVO = 5242880;
const LIMITE_POR_IP = 5;
const JANELA_SEGUNDOS = 600;

function responder($ok, $codigo = 200) {
  http_response_code($codigo);
  echo json_encode(array('success' => $ok));
  exit;
}

function origemPermitida() {
  $host = strtolower(preg_replace('/:\d+$/', '', isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ''));
  $origem = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '');
  if ($origem === '') return true;
  $hostOrigem = strtolower((string)parse_url($origem, PHP_URL_HOST));
  $semWww = function ($h) { return preg_replace('/^www\./', '', $h); };
  return $hostOrigem !== '' && $semWww($hostOrigem) === $semWww($host);
}

function celulaSegura($valor) {
  $valor = str_replace(array("\r", "\n", "\t"), ' ', (string)$valor);
  return preg_match('/^[=+\-@]/', $valor) ? "'" . $valor : $valor;
}

function dentroDoLimite($pasta) {
  $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'desconhecido';
  $arquivo = $pasta . '/.limite-' . substr(hash('sha256', $ip . __FILE__), 0, 24);
  $agora = time();
  $marcas = array();
  if (is_file($arquivo)) {
    foreach (explode(',', (string)@file_get_contents($arquivo)) as $t) {
      if ((int)$t > $agora - JANELA_SEGUNDOS) $marcas[] = (int)$t;
    }
  }
  if (count($marcas) >= LIMITE_POR_IP) return false;
  $marcas[] = $agora;
  @file_put_contents($arquivo, implode(',', $marcas), LOCK_EX);
  return true;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(false, 405);
$tipo = isset($_SERVER['CONTENT_TYPE']) ? strtolower($_SERVER['CONTENT_TYPE']) : '';
if (strpos($tipo, 'application/json') !== 0) responder(false, 415);
if (!origemPermitida()) responder(false, 403);

$dados = json_decode((string)file_get_contents('php://input', false, null, 0, 4096), true);
if (!is_array($dados)) responder(false, 400);
if (!empty($dados['_honey'])) responder(true);

$email = isset($dados['email']) ? trim((string)$dados['email']) : '';
if ($email === '' || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) responder(false, 422);
$email  = strtolower($email);
$origem = isset($dados['origem']) ? substr(preg_replace('/[^\p{L}\p{N} \-—]/u', '', (string)$dados['origem']), 0, 60) : '';

$pasta   = __DIR__ . '/dados';
$arquivo = $pasta . '/emails.csv';
if (!is_dir($pasta) && !mkdir($pasta, 0750, true)) responder(false, 500);
if (!dentroDoLimite($pasta)) responder(false, 429);
if (is_file($arquivo) && filesize($arquivo) > LIMITE_ARQUIVO) responder(false, 507);

$fp = fopen($arquivo, 'c+');
if (!$fp) responder(false, 500);
flock($fp, LOCK_EX);

$novo = (fstat($fp)['size'] === 0);
rewind($fp);
while (($linha = fgetcsv($fp, 1000, ';')) !== false) {
  if (isset($linha[1]) && strtolower(ltrim($linha[1], "'")) === $email) { flock($fp, LOCK_UN); fclose($fp); responder(true); }
}
fseek($fp, 0, SEEK_END);
if ($novo) fwrite($fp, "\xEF\xBB\xBF" . "data;email;origem\n");
date_default_timezone_set('America/Sao_Paulo');
fputcsv($fp, array(date('d/m/Y H:i'), celulaSegura($email), celulaSegura($origem)), ';');
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);
responder(true);
