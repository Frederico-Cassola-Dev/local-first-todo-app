<?php

namespace App\Controller;

use App\Entity\Todo;
use App\Repository\TodoRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/todos', name: 'api_todos_')]
class TodoApiController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode(
                $request->getContent(),
                true,
                512,
                JSON_THROW_ON_ERROR
            );

            if (!isset($data['task'])) {
                return $this->json(['error' => 'Task field is required'], 400);
            }

            $todo = new Todo();
            $todo->setTask(trim($data['task']));
            $todo->setIsCompleted($data['isCompleted'] ?? false);
            $todo->setCreatedAt(new \DateTimeImmutable());

            $errors = $this->validator->validate($todo);
            if (count($errors) > 0) {
                return $this->json(['errors' => (string) $errors], 422);
            }

            $this->em->persist($todo);
            $this->em->flush();

            return $this->json(
                $todo,
                201,
                [],
                ['groups' => ['todo:read']]
            );
        } catch (\JsonException) {
            return $this->json(['error' => 'Invalid JSON format'], 400);
        }
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(TodoRepository $repository): JsonResponse
    {
        $todos = $repository->findAll();

        return $this->json(
            ['data' => $todos],
            200,
            [],
            [
                'groups' => ['todo:read'],
                DateTimeNormalizer::FORMAT_KEY => \DateTimeInterface::ATOM,
            ]
        );
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id, TodoRepository $repository): JsonResponse
    {
        $todo = $repository->find($id);

        if (!$todo) {
            return $this->json(['error' => 'Todo not found'], 404);
        }

        $this->em->remove($todo);
        $this->em->flush();

        return $this->json(['message' => 'Todo deleted successfully'], 204);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(string $id, TodoRepository $repository, Request $request): JsonResponse
    {
        $todo = $repository->find($id);

        if (!$todo) {
            return $this->json(['error' => 'Todo not found'], 404);
        }

        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return $this->json(['error' => 'Invalid JSON format'], 400);
        }

        // 3. Update fields
        if (isset($data['task'])) {
            $todo->setTask(trim($data['task']));
        }
        if (isset($data['isCompleted'])) {
            $todo->setIsCompleted((bool) $data['isCompleted']);
        }

        // 4. Validate changes
        $errors = $this->validator->validate($todo);
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], 422);
        }

        // 5. Save changes (no need for insert/update - Doctrine tracks changes)
        $this->em->flush();

        // 6. Return updated Todo
        return $this->json(
            $todo,
            200, // ✅ 200 OK instead of 204 No Content
            [],
            ['groups' => ['todo:read']]
        );
    }
}
