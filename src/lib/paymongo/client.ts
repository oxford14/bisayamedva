const PAYMONGO_API = "https://api.paymongo.com/v1";

type PaymongoErrorBody = {
  errors?: Array<{ detail?: string; code?: string }>;
};

function authHeader(key: string) {
  const token = Buffer.from(`${key}:`).toString("base64");
  return `Basic ${token}`;
}

function requireSecretKey() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("Missing PAYMONGO_SECRET_KEY.");
  return key;
}

function requirePublicKey() {
  const key = process.env.PAYMONGO_PUBLIC_KEY;
  if (!key) throw new Error("Missing PAYMONGO_PUBLIC_KEY.");
  return key;
}

async function paymongoFetch<T>(
  path: string,
  {
    method = "GET",
    body,
    key,
  }: {
    method?: "GET" | "POST";
    body?: unknown;
    key: string;
  },
): Promise<T> {
  const response = await fetch(`${PAYMONGO_API}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(key),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const json = (await response.json()) as T & PaymongoErrorBody;
  if (!response.ok) {
    const detail =
      json.errors?.[0]?.detail ||
      `PayMongo request failed (${response.status}).`;
    throw new Error(detail);
  }
  return json;
}

export type PaymongoPaymentIntent = {
  id: string;
  attributes: {
    amount: number;
    currency: string;
    status: string;
    client_key: string;
    next_action?: {
      type?: string;
      code?: {
        image_url?: string;
        id?: string;
      };
    } | null;
  };
};

export type PaymongoResource<T> = {
  data: T;
};

export async function createQrPhPaymentIntent(input: {
  amountPesos: number;
  description: string;
  metadata?: Record<string, string>;
}) {
  const amount = Math.round(input.amountPesos * 100);
  if (amount < 2000) {
    throw new Error("PayMongo QR Ph minimum amount is ₱20.");
  }

  const result = await paymongoFetch<PaymongoResource<PaymongoPaymentIntent>>(
    "/payment_intents",
    {
      method: "POST",
      key: requireSecretKey(),
      body: {
        data: {
          attributes: {
            amount,
            currency: "PHP",
            payment_method_allowed: ["qrph"],
            description: input.description,
            statement_descriptor: "BisayaMedVA",
            metadata: input.metadata ?? {},
          },
        },
      },
    },
  );

  return result.data;
}

export async function createQrPhPaymentMethod() {
  const result = await paymongoFetch<
    PaymongoResource<{ id: string; type: string }>
  >("/payment_methods", {
    method: "POST",
    key: requirePublicKey(),
    body: {
      data: {
        attributes: {
          type: "qrph",
        },
      },
    },
  });

  return result.data;
}

export async function attachQrPhPaymentMethod(input: {
  paymentIntentId: string;
  paymentMethodId: string;
  clientKey: string;
}) {
  const result = await paymongoFetch<PaymongoResource<PaymongoPaymentIntent>>(
    `/payment_intents/${input.paymentIntentId}/attach`,
    {
      method: "POST",
      key: requirePublicKey(),
      body: {
        data: {
          attributes: {
            payment_method: input.paymentMethodId,
            client_key: input.clientKey,
          },
        },
      },
    },
  );

  return result.data;
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  const result = await paymongoFetch<PaymongoResource<PaymongoPaymentIntent>>(
    `/payment_intents/${paymentIntentId}`,
    {
      method: "GET",
      key: requireSecretKey(),
    },
  );
  return result.data;
}

export async function createLiveQrPhCheckout(input: {
  amountPesos: number;
  description: string;
  metadata?: Record<string, string>;
}) {
  const intent = await createQrPhPaymentIntent(input);
  const method = await createQrPhPaymentMethod();
  const attached = await attachQrPhPaymentMethod({
    paymentIntentId: intent.id,
    paymentMethodId: method.id,
    clientKey: intent.attributes.client_key,
  });

  const imageUrl = attached.attributes.next_action?.code?.image_url;
  if (!imageUrl) {
    throw new Error("PayMongo did not return a QR Ph image.");
  }

  return {
    paymentIntentId: attached.id,
    status: attached.attributes.status,
    qrImageUrl: imageUrl,
    clientKey: attached.attributes.client_key,
  };
}
