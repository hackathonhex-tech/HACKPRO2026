import Role from '../models/Role';
import connectToDatabase from '@/server/config/db';

export async function getRoles() {
  await connectToDatabase();
  const roles = await Role.find().lean();
  return { roles: JSON.parse(JSON.stringify(roles)) };
}

export async function createRole(body: { name: string; permissions: string[] }) {
  await connectToDatabase();
  
  const existingRole = await Role.findOne({ name: body.name });
  if (existingRole) {
    throw new Error('Role with this name already exists');
  }

  const newRole = new Role({
    name: body.name,
    permissions: body.permissions || []
  });

  await newRole.save();
  return { role: JSON.parse(JSON.stringify(newRole)) };
}

export async function updateRole(id: string, body: { name: string; permissions: string[] }) {
  await connectToDatabase();

  const updateData = { 
    name: body.name, 
    permissions: body.permissions || [],
    updatedAt: new Date()
  };

  const role = await Role.findByIdAndUpdate(id, updateData, { new: true }).lean();

  if (!role) {
    throw new Error('Role not found');
  }

  return { role: JSON.parse(JSON.stringify(role)) };
}

export async function deleteRole(id: string) {
  await connectToDatabase();
  const result = await Role.deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    throw new Error('Role not found');
  }
}
