const { randomUUID } = require("node:crypto");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

exports.handler = async (event) => {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST,OPTIONS"
  };

  try {
    const body = JSON.parse(event.body || "{}");
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!name || name.length > 100) {
      return reply(400, { error: "Escribe un nombre de hasta 100 caracteres." }, headers);
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply(400, { error: "Escribe una dirección de email válida." }, headers);
    }

    const registration = {
      id: randomUUID(),
      name,
      email,
      createdAt: new Date().toISOString()
    };

    await dynamo.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: registration
    }));

    await sns.send(new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Subject: "Nueva inscripción · Plano Corto",
      Message: JSON.stringify(registration, null, 2)
    }));

    return reply(201, { message: "Inscripción guardada.", id: registration.id }, headers);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return reply(400, { error: "El cuerpo de la solicitud no es JSON válido." }, headers);
    }
    console.error("No se pudo completar la inscripción:", error);
    return reply(500, { error: "No pudimos procesar la inscripción. Prueba de nuevo." }, headers);
  }
};

function reply(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) };
}