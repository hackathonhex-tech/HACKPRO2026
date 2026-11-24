import User from '../models/User';
import bcrypt from 'bcrypt';
import connectToDatabase from '@/server/config/db';
import '../models/Role'; // Ensure Role model is registered for populate

export async function getSubAdmins() {
  await connectToDatabase();
  const subAdmins = await User.find({ role: 'sub-admin' }).populate('customRoleId').lean();
  return { subAdmins: JSON.parse(JSON.stringify(subAdmins)) };
}

export async function createSubAdmin(body: any) {
  await connectToDatabase();
  
  const cleanEmail = (body.email || '').trim().toLowerCase();
  const existingUser = await User.findOne({ 
    $or: [
      { email: cleanEmail }, 
      { uniqueId: cleanEmail },
      { email: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    ] 
  });
  if (existingUser) {
    throw new Error(`A user with the email "${body.email}" already exists (as a ${existingUser.role || 'user'}).`);
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);
  
  const newSubAdmin = new User({
    name: body.name ? body.name.trim() : 'Sub-Admin',
    email: cleanEmail,
    uniqueId: cleanEmail,
    password: hashedPassword,
    role: 'sub-admin',
    customRoleId: body.customRoleId || null
  });

  await newSubAdmin.save();
  const populatedUser = await User.findById(newSubAdmin._id).populate('customRoleId').lean();
  return { subAdmin: JSON.parse(JSON.stringify(populatedUser)) };
}

export async function updateSubAdmin(id: string, body: any) {
  await connectToDatabase();

  const updateData: any = { 
    name: body.name, 
    email: body.email
  };
  
  if (body.customRoleId !== undefined) {
    updateData.customRoleId = body.customRoleId;
  }
  
  if (body.password) {
    updateData.password = await bcrypt.hash(body.password, 10);
  }

  const subAdmin = await User.findOneAndUpdate(
    { _id: id, role: 'sub-admin' },
    updateData,
    { new: true }
  ).populate('customRoleId').lean();

  if (!subAdmin) {
    throw new Error('Sub-Admin not found');
  }

  return { subAdmin: JSON.parse(JSON.stringify(subAdmin)) };
}

export async function deleteSubAdmin(id: string) {
  await connectToDatabase();
  const result = await User.deleteOne({ _id: id, role: 'sub-admin' });
  if (result.deletedCount === 0) {
    throw new Error('Sub-Admin not found');
  }
}
