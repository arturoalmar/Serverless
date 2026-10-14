# Plano Corto · Festival de cortometrajes

Landing responsive con formulario de nombre y email. El frontend es estatico; el backend utiliza API Gateway HTTP API, Lambda (Node.js), DynamoDB y SNS.

## Arquitectura

```text
Navegador → GitHub Pages o S3 → POST /registrations
                                  ↓
                             API Gateway
                                  ↓
                               Lambda
                              ↙      ↘
                     DynamoDB       SNS → email confirmado
```

La Lambda valida los dos campos en el servidor, guarda una inscripcion con identificador UUID y publica una notificacion. Su rol recibe solo permisos de escritura en la tabla y publicacion en el topic definidos en la plantilla SAM.

## Publicar API e infraestructura AWS

Requisitos: AWS CLI configurado en la cuenta/región correctas, AWS SAM CLI y permisos para crear los recursos de la plantilla. En AWS Academy, confirma que el laboratorio permite crear los recursos y el rol que SAM necesita.

```sh
cd infra/festival
sam build
sam deploy --guided --parameter-overrides NotificationEmail=tu-correo@example.com
```

Guarda los outputs `ApiUrl` y `WebsiteBucket`. AWS SNS enviará una solicitud de suscripción: abre el correo y confirma antes de probar las notificaciones. La URL de S3 del output es un endpoint HTTP de sitio estático; usa CloudFront delante de S3 si necesitas HTTPS.

## Publicar el sitio en S3

Desde la raíz del repositorio, reemplaza el bucket por el output `WebsiteBucket`:

```sh
aws s3 sync festival/ s3://NOMBRE_DEL_BUCKET --delete
```

S3 solo publica los archivos estáticos de `festival/`; el código de Lambda y la plantilla permanecen en `infra/festival/`.

## Conectar el formulario

En `festival/config.js`, asigna el output `ApiUrl`:

```js
window.FESTIVAL_API_URL = "https://ID.execute-api.REGION.amazonaws.com/prod/registrations";
```

Para GitHub Pages, confirma el cambio en GitHub y espera el despliegue del branch `main`. Para S3, vuelve a sincronizar los archivos después de cambiar la URL. Comparte el endpoint solo por HTTPS; nunca pongas credenciales AWS en el frontend.

## Comprobación

Envía una inscripción desde la web y comprueba la respuesta `201`, el item por `id` en DynamoDB y el mensaje en el correo suscrito al topic SNS. También se puede probar la validación con una petición incompleta:

```sh
curl -i -X POST "URL_API" \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"no-es-un-email"}'
```

Debe devolver `400`. Revisa CloudWatch si la API responde `500`. DynamoDB y SNS son dos operaciones distintas: si la publicación falla después de guardar, el registro puede existir aunque la llamada termine con error.

## Límites conocidos

- El sitio S3 configurado por SAM es público y HTTP. GitHub Pages ofrece HTTPS; para HTTPS en AWS añade CloudFront y un dominio/certificado.
- La API es pública y sin autenticación. Para una campaña real conviene añadir cuotas/throttling, protección contra abuso y una política de privacidad completa.
- La inscripción guarda el email y el mensaje SNS lo distribuye a los suscriptores confirmados. Limita quién tiene acceso al topic y a la tabla.