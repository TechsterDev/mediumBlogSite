import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();
blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("authorization") || "";
  try{
    const user = await verify(authHeader, c.env.JWT_SECRET);
    if (user) {
      // @ts-ignore
      c.set("userId", user.id);
      await next();
    } else {
      c.status(411);
      return c.json({
        msg: "you arenot logedin",
      });
    }
  }catch(e){
    c.status(403);
    return c.json({
        msg:"you are not loged in!!"
    })
  }
 
});

blogRouter.post("/", async (c) => {
  const body = await c.req.json();
  const authorId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: Number(authorId),
      },
    });
    return c.json({
      id: blog.id,
    });
  } catch (e) {
    c.status(411);
    return c.json({
      msg: "can't post the blog",
    });
  }
});

blogRouter.put("/", async (c) => {
  const body = await c.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const blog = await prisma.blog.update({
      where: {
        id: body.id,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    return c.json({
      id: blog.id,
    });
  } catch (e) {
    c.status(411);
    return c.json({
      msg: "can't find the post",
    });
  }
});

//pagination
blogRouter.get("/bulk", async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
      const blog = await prisma.blog.findMany();
      return c.json({
        id: blog,
      });
    } catch (e) {
      c.status(411);
      return c.json({
        msg: "something wrong happened",
      });
    }
  });

blogRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const blog = await prisma.blog.findFirst({
      where: {
        id:Number(id),
      },
    });
    return c.json({
      id: blog,
    });
  } catch (e) {
    c.status(411);
    return c.json({
      msg: "error while fetching blog post",
    });
  }
});

