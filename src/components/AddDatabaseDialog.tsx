import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Database, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDatabase } from "@/hooks/useDatabases";
import { useSites } from "@/hooks/useSites";
import { useToast } from "@/hooks/use-toast";
import { useLogActivity } from "@/hooks/useActivityLogs";

const databaseSchema = z.object({
  name: z
    .string()
    .min(1, "Database name is required")
    .max(64, "Database name must be less than 64 characters")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Name must start with a letter and contain only letters, numbers, and underscores"),
  site_id: z.string().uuid("Please select a site"),
  db_type: z.enum(["mysql", "postgresql", "mariadb"]),
  username: z
    .string()
    .min(1, "Username is required")
    .max(32, "Username must be less than 32 characters")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Username must start with a letter and contain only letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  db_charset: z.string().optional(),
  db_collation: z.string().optional(),
});

type DatabaseFormData = z.infer<typeof databaseSchema>;

interface AddDatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddDatabaseDialog = ({ open, onOpenChange }: AddDatabaseDialogProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const { data: sites, isLoading: sitesLoading } = useSites();
  const createDatabase = useCreateDatabase();
  const { toast } = useToast();
  const { logDatabaseCreated } = useLogActivity();

  const form = useForm<DatabaseFormData>({
    resolver: zodResolver(databaseSchema),
    defaultValues: {
      name: "",
      site_id: "",
      db_type: "mysql",
      username: "",
      password: "",
      db_charset: "utf8mb4",
      db_collation: "utf8mb4_unicode_ci",
    },
  });

  const selectedDbType = form.watch("db_type");

  const charsetOptions = {
    mysql: ["utf8mb4", "utf8", "latin1", "ascii"],
    postgresql: ["UTF8", "LATIN1", "SQL_ASCII"],
    mariadb: ["utf8mb4", "utf8", "latin1", "ascii"],
  };

  const collationOptions = {
    mysql: ["utf8mb4_unicode_ci", "utf8mb4_general_ci", "utf8_general_ci", "latin1_swedish_ci"],
    postgresql: ["en_US.UTF-8", "C", "POSIX"],
    mariadb: ["utf8mb4_unicode_ci", "utf8mb4_general_ci", "utf8_general_ci", "latin1_swedish_ci"],
  };

  const onSubmit = async (data: DatabaseFormData) => {
    try {
      await createDatabase.mutateAsync({
        name: data.name,
        site_id: data.site_id,
        db_type: data.db_type,
        username: data.username,
        password_hash: data.password, // In production, this should be hashed server-side
        db_charset: data.db_charset,
        db_collation: data.db_collation,
      });

      // Log activity
      logDatabaseCreated(data.name, data.site_id);

      toast({
        title: "Database created",
        description: `Database "${data.name}" has been created successfully.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create database.",
      });
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create New Database</DialogTitle>
              <DialogDescription>
                Create a new database for your site
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="site_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select a site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      {sitesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading sites...
                        </SelectItem>
                      ) : sites?.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No sites available
                        </SelectItem>
                      ) : (
                        sites?.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.domain}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="db_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mariadb">MariaDB</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="my_database"
                      className="bg-secondary border-border"
                    />
                  </FormControl>
                  <FormDescription>
                    Must start with a letter, only letters, numbers, and underscores
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="db_user"
                      className="bg-secondary border-border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <div className="relative flex-1">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-secondary border-border pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      className="shrink-0"
                    >
                      Generate
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="db_charset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charset</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        {charsetOptions[selectedDbType].map((charset) => (
                          <SelectItem key={charset} value={charset}>
                            {charset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="db_collation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        {collationOptions[selectedDbType].map((collation) => (
                          <SelectItem key={collation} value={collation}>
                            {collation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDatabase.isPending}
                className="bg-gradient-to-r from-primary to-info hover:opacity-90"
              >
                {createDatabase.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Database"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
