import { compare, hash } from "bcryptjs";

// Hachage de mot de passe pour le stockage sécurisé
export async function hashPassword(password: string): Promise<string> {
  // Utiliser un facteur de coût de 12 pour bcrypt
  return await hash(password, 12);
}

// Vérification de mot de passe
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword);
} 