import prisma from "@/lib/prisma";


export const createWaitlistEntry = async (email: string, name: string) => {
    try {
        
        const waitlistEntry = await prisma.waitlist.create({
            data: { email, name }
        });

        return {
            "name":waitlistEntry.name,
            "email":waitlistEntry.email        
        };
    } catch (error) {
        throw error;
    }
}