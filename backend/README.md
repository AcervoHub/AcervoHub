



## Comandos usados na verificação do token

 *(auth.middleware.ts:15)*
    ^	Início da string
    Bearer	Exige a palavra Bearer
        Exige um espaço depois de Bearer
    ( )	Cria um grupo de captura
    [^\s]	Aceita qualquer caractere que não seja espaço em branco
    +	Exige pelo menos um caractere
    $	Final da string
    i	Ignora diferenças entre maiúsculas e minúsculas


  *(auth.middleware.ts:26)*
    algorithms: ["HS256"]
    HS → HMAC (Hash-based Message Authentication Code).
    256 → SHA-256.