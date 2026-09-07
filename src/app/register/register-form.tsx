"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type SignupState } from "@/app/register/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SignupState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Đăng ký tài khoản CRM
        </CardTitle>
        <CardDescription>
          Tạo tài khoản mới để sử dụng hệ thống crm-dauan
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4 pt-6">
          {state.error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="fullName">Họ và Tên</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              required
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              required
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={6}
              required
              disabled={pending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
